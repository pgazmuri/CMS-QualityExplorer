import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { StarRatingBadge } from '@/components/dashboards/StarRatingBadge';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Patient Experience' };

const HCAHPS_DOMAINS: Record<string, string> = {
  'H_COMP_1_STAR_RATING': 'Nurse Communication',
  'H_COMP_2_STAR_RATING': 'Doctor Communication',
  'H_COMP_3_STAR_RATING': 'Staff Responsiveness',
  'H_COMP_5_STAR_RATING': 'Communication About Medicines',
  'H_COMP_6_STAR_RATING': 'Discharge Information',
  'H_COMP_7_STAR_RATING': 'Care Transition',
  'H_CLEAN_STAR_RATING':  'Cleanliness',
  'H_QUIET_STAR_RATING':  'Quietness',
  'H_HSP_RATING_STAR_RATING': 'Overall Hospital Rating',
  'H_RECMND_STAR_RATING': 'Recommend Hospital',
  'H_STAR_RATING':        'Overall HCAHPS Star Rating',
};

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
        <h1 className="text-2xl font-bold tracking-tight">Patient Experience</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          HCAHPS survey star ratings across communication, responsiveness, and overall experience domains.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Hospitals Rated" value={totalRated.toLocaleString()} />
        <SummaryCard label="Avg Overall Star" value={avgStarWeighted.toFixed(2)} />
        <SummaryCard label="5-Star Hospitals" value={(starDist.find((r) => r.star_rating === 5)?.cnt ?? 0).toLocaleString()} />
        <SummaryCard label="1-Star Hospitals" value={(starDist.find((r) => r.star_rating === 1)?.cnt ?? 0).toLocaleString()} />
      </div>

      {/* Star distribution */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">Overall Star Rating Distribution</h2>
        <div className="flex items-end gap-3 h-28">
          {[1, 2, 3, 4, 5].map((star) => {
            const row = starDist.find((r) => r.star_rating === star);
            const cnt = row ? Number(row.cnt) : 0;
            const maxCnt = Math.max(...starDist.map((r) => Number(r.cnt)));
            const height = maxCnt > 0 ? (cnt / maxCnt) * 100 : 0;
            const colors = ['', '#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e'];
            return (
              <div key={star} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-xs font-medium">{cnt.toLocaleString()}</span>
                <div
                  className="w-full rounded-t"
                  style={{ height: `${height}%`, minHeight: cnt > 0 ? 4 : 0, background: colors[star] }}
                />
                <span className="text-xs">{'★'.repeat(star)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain averages table */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">Average Score by HCAHPS Domain</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left pb-2 font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>Domain</th>
                <th className="text-right pb-2 font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>Avg Stars</th>
                <th className="text-right pb-2 font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>Linear Mean</th>
                <th className="text-right pb-2 font-medium text-xs" style={{ color: 'var(--muted-foreground)' }}>Hospitals</th>
              </tr>
            </thead>
            <tbody>
              {domainAvgs.map((row) => (
                <tr key={row.measure_id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 text-xs">{HCAHPS_DOMAINS[row.measure_id] ?? row.measure_id}</td>
                  <td className="py-2 text-right">
                    {row.avg_stars != null ? <StarRatingBadge rating={Math.round(row.avg_stars)} showLabel={false} /> : 'N/A'}
                  </td>
                  <td className="py-2 text-right text-xs font-mono">{row.avg_linear?.toFixed(1) ?? 'N/A'}</td>
                  <td className="py-2 text-right text-xs" style={{ color: 'var(--muted-foreground)' }}>{row.hospital_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </div>
  );
}
