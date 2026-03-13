import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { ClinicalOutcomesClient } from './ClinicalOutcomesClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Clinical Outcomes' };

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Clinical Outcomes
          <InfoTooltip measureId="mort_30_ami" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          30-day mortality rates and complication rates compared to national benchmarks.{' '}
          <a href="/about#clinical-outcomes" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>
      <ClinicalOutcomesClient benchmarks={benchmarks} distribution={distribution} />
    </div>
  );
}
