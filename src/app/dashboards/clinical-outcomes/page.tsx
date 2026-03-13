import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { BenchmarkBadge } from '@/components/dashboards/BenchmarkBadge';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Clinical Outcomes' };

const MEASURE_LABELS: Record<string, string> = {
  'MORT_30_AMI':  '30-Day Mortality: Heart Attack (AMI)',
  'MORT_30_HF':   '30-Day Mortality: Heart Failure',
  'MORT_30_PN':   '30-Day Mortality: Pneumonia',
  'MORT_30_COPD': '30-Day Mortality: COPD',
  'MORT_30_CABG': '30-Day Mortality: CABG',
  'COMP_HIP_KNEE':'Complications: Hip/Knee Replacement',
};

export default async function ClinicalOutcomesPage() {
  const [benchmarks, distribution] = await Promise.all([
    query<{ measure_id: string; national_rate: number | null; better: number; same: number; worse: number }>(`
      SELECT
        m.measure_id,
        TRY_CAST(n."National Rate" AS DOUBLE) AS national_rate,
        COUNT(CASE WHEN m.compared_to_national ILIKE '%better%' THEN 1 END) AS better,
        COUNT(CASE WHEN m.compared_to_national ILIKE '%no different%' THEN 1 END) AS same,
        COUNT(CASE WHEN m.compared_to_national ILIKE '%worse%' THEN 1 END) AS worse
      FROM v_mortality m
      LEFT JOIN complications_deaths_national n ON m.measure_id = n."Measure ID"
      WHERE m.measure_id IN ('MORT_30_AMI','MORT_30_HF','MORT_30_PN','MORT_30_COPD','MORT_30_CABG','COMP_HIP_KNEE')
      GROUP BY m.measure_id, n."National Rate"
      ORDER BY m.measure_id
    `),
    query<{ measure_id: string; avg_score: number | null; min_score: number | null; max_score: number | null }>(`
      SELECT measure_id,
             ROUND(AVG(score), 2) AS avg_score,
             ROUND(MIN(score), 2) AS min_score,
             ROUND(MAX(score), 2) AS max_score
      FROM v_mortality
      WHERE score IS NOT NULL
        AND measure_id IN ('MORT_30_AMI','MORT_30_HF','MORT_30_PN','MORT_30_COPD','MORT_30_CABG','COMP_HIP_KNEE')
      GROUP BY measure_id
      ORDER BY measure_id
    `),
  ]);

  const distMap = Object.fromEntries(distribution.map((r) => [r.measure_id, r]));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Clinical Outcomes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          30-day risk-adjusted mortality rates and complication rates vs. national benchmarks.
        </p>
      </div>

      <div className="space-y-4">
        {benchmarks.map((row) => {
          const dist = distMap[row.measure_id];
          const total = Number(row.better) + Number(row.same) + Number(row.worse);
          return (
            <div
              key={row.measure_id}
              className="rounded-xl border p-5"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-sm">{MEASURE_LABELS[row.measure_id] ?? row.measure_id}</h3>
                  {row.national_rate != null && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      National rate: {row.national_rate.toFixed(1)}%
                    </p>
                  )}
                </div>
                {dist && (
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Avg: {dist.avg_score?.toFixed(1)}%</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Range: {dist.min_score?.toFixed(1)} – {dist.max_score?.toFixed(1)}</p>
                  </div>
                )}
              </div>

              {/* Better/Same/Worse bar */}
              {total > 0 && (
                <div className="mt-4">
                  <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                    {[
                      { k: 'better', color: '#22c55e', n: Number(row.better) },
                      { k: 'same',   color: '#eab308', n: Number(row.same) },
                      { k: 'worse',  color: '#ef4444', n: Number(row.worse) },
                    ].map(({ k, color, n }) => (
                      n > 0 && (
                        <div
                          key={k}
                          style={{ width: `${(n / total) * 100}%`, background: color }}
                          title={`${k}: ${n.toLocaleString()} (${((n / total) * 100).toFixed(1)}%)`}
                        />
                      )
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="text-green-600">↑ Better: {Number(row.better).toLocaleString()}</span>
                    <span>≈ Same: {Number(row.same).toLocaleString()}</span>
                    <span className="text-red-600">↓ Worse: {Number(row.worse).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
