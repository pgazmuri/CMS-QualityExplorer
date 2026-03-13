import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { VBPClient } from './VBPClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Value-Based Programs' };

export default async function ValueBasedProgramsPage() {
  const [hvbpAll, hacSummary, hrrpByMeasure, statesRaw] = await Promise.all([
    query<{ facility_id: string; facility_name: string; state: string; tps: number | null; clinical_score: number | null; safety_score: number | null; engagement_score: number | null; efficiency_score: number | null }>(`
      SELECT facility_id, facility_name, state, tps,
             clinical_score, safety_score, engagement_score, efficiency_score
      FROM v_hvbp_tps
      WHERE tps IS NOT NULL
      ORDER BY tps DESC
    `),
    query<{ payment_reduction: string; cnt: number; avg_score: number | null }>(`
      SELECT payment_reduction, COUNT(*) AS cnt,
             ROUND(AVG(hac_score), 3) AS avg_score
      FROM v_hac
      WHERE payment_reduction IS NOT NULL
      GROUP BY payment_reduction
    `),
    query<{ measure_name: string; avg_excess: number | null; hospital_count: number; above_one: number }>(`
      SELECT measure_name,
             ROUND(AVG(excess_ratio), 4) AS avg_excess,
             COUNT(*) AS hospital_count,
             COUNT(CASE WHEN excess_ratio > 1.0 THEN 1 END) AS above_one
      FROM v_hrrp
      WHERE excess_ratio IS NOT NULL
      GROUP BY measure_name
      ORDER BY measure_name
    `),
    query<{ state: string }>(`SELECT DISTINCT state FROM v_hvbp_tps WHERE state IS NOT NULL ORDER BY state`),
  ]);

  const states = statesRaw.map((r) => r.state);
  const hacPenalized = hacSummary.find((r) => r.payment_reduction === 'Yes');
  const hacNormal = hacSummary.find((r) => r.payment_reduction === 'No');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Value-Based Programs
          <InfoTooltip measureId="hvbp" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Hospital Value-Based Purchasing (HVBP) scores, HAC Reduction Program penalties, and
          Hospital Readmissions Reduction Program (HRRP) excess ratios.{' '}
          <a href="/about#hvbp" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>

      <VBPClient
        hvbpTop={hvbpAll}
        hacSummary={hacSummary}
        hrrpByMeasure={hrrpByMeasure}
        states={states}
        hacPenalized={hacPenalized}
        hacNormal={hacNormal}
      />
    </div>
  );
}
