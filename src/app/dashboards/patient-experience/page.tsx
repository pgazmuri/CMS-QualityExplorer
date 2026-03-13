import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { PatientExperienceClient } from './PatientExperienceClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Patient Experience' };

export default async function PatientExperiencePage() {
  const [starDist, domainAvgs] = await Promise.all([
    query<{ star_rating: number; cnt: number }>(`
      SELECT star_rating, COUNT(*) AS cnt
      FROM v_hospital_profile
      WHERE star_rating IS NOT NULL
      GROUP BY star_rating
      ORDER BY star_rating
    `),
    query<{ measure_id: string; avg_stars: number | null; avg_linear: number | null; hospital_count: number }>(`
      SELECT measure_id,
             ROUND(AVG(star_rating), 2) AS avg_stars,
             ROUND(AVG(linear_mean), 2)  AS avg_linear,
             COUNT(*)                    AS hospital_count
      FROM v_hcahps_stars
      WHERE star_rating IS NOT NULL
      GROUP BY measure_id
      ORDER BY measure_id
    `),
  ]);

  const totalRated = starDist.reduce((s, r) => s + Number(r.cnt), 0);
  const avgStarWeighted = starDist.reduce((s, r) => s + r.star_rating * Number(r.cnt), 0) / (totalRated || 1);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Patient Experience
          <InfoTooltip measureId="hcahps" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          HCAHPS survey star ratings across communication, responsiveness, and overall experience domains.{' '}
          <a href="/about#hcahps" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>

      <PatientExperienceClient
        starDist={starDist}
        domainAvgs={domainAvgs}
        totalRated={totalRated}
        avgStarWeighted={avgStarWeighted}
      />
    </div>
  );
}
