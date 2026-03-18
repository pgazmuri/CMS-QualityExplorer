import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query, queryParameterized } from '@/lib/duckdb/instance';
import { StateDetailClient } from './StateDetailClient';
import type { StateHospital, StateSummary } from './types';

export const dynamic = 'force-dynamic';

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AS:'American Samoa',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',
  GA:'Georgia',GU:'Guam',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',
  NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',
  NC:'North Carolina',ND:'North Dakota',MP:'Northern Mariana Islands',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',PR:'Puerto Rico',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VI:'Virgin Islands',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};

interface Props {
  params: Promise<{ stateCode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateCode } = await params;
  const code = stateCode.toUpperCase();
  const name = STATE_NAMES[code] ?? code;
  return { title: `${name} Hospitals | Geographic Atlas` };
}

export default async function StateDetailPage({ params }: Props) {
  const { stateCode } = await params;
  const code = stateCode.toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) notFound();

  const stateName = STATE_NAMES[code];
  if (!stateName) notFound();

  const [hospitals, summaryRows] = await Promise.all([
    queryParameterized<StateHospital>(`
      SELECT
        h.facility_id, h.facility_name, h.city, h.zip,
        h.hospital_type, h.ownership, h.emergency_services,
        h.star_rating, h.latitude, h.longitude,
        h.mort_better, h.mort_same, h.mort_worse,
        h.safety_better, h.safety_same, h.safety_worse,
        h.readm_better, h.readm_same, h.readm_worse,
        m.mspb_ratio,
        hac.hac_score, hac.payment_reduction,
        hcahps.star_rating AS hcahps_overall
      FROM v_hospital_profile h
      LEFT JOIN v_mspb m ON h.facility_id = m.facility_id
      LEFT JOIN v_hac hac ON h.facility_id = hac.facility_id
      LEFT JOIN v_hcahps_stars hcahps
        ON h.facility_id = hcahps.facility_id
        AND hcahps.measure_id = 'H_STAR_RATING'
      WHERE h.state = $state_code
      ORDER BY h.star_rating DESC NULLS LAST, h.facility_name
    `, { state_code: code }),
    queryParameterized<{
      hospital_count: number;
      avg_star_rating: number | null;
      avg_mspb: number | null;
      hac_penalized_count: number;
      national_avg_star: number | null;
      national_avg_mspb: number | null;
      star_rank: number;
      total_states: number;
    }>(`
      WITH state_stats AS (
        SELECT state, hospital_count, avg_star_rating, avg_mspb, hac_penalized_count,
               RANK() OVER (ORDER BY avg_star_rating DESC NULLS LAST) AS star_rank,
               COUNT(*) OVER () AS total_states
        FROM v_state_summary
      ),
      national AS (
        SELECT ROUND(AVG(star_rating), 2) AS national_avg_star,
               ROUND(AVG(m.mspb_ratio), 3) AS national_avg_mspb
        FROM v_hospital_profile h
        LEFT JOIN v_mspb m ON h.facility_id = m.facility_id
        WHERE h.star_rating IS NOT NULL
      )
      SELECT s.hospital_count, s.avg_star_rating, s.avg_mspb, s.hac_penalized_count,
             n.national_avg_star, n.national_avg_mspb, s.star_rank, s.total_states
      FROM state_stats s CROSS JOIN national n
      WHERE s.state = $state_code
    `, { state_code: code }),
  ]);

  if (hospitals.length === 0) notFound();

  const summary: StateSummary = summaryRows[0] ?? {
    hospital_count: hospitals.length,
    avg_star_rating: null,
    avg_mspb: null,
    hac_penalized_count: 0,
    national_avg_star: null,
    national_avg_mspb: null,
    star_rank: 0,
    total_states: 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <StateDetailClient
        stateCode={code}
        stateName={stateName}
        hospitals={hospitals}
        summary={summary}
      />
    </div>
  );
}
