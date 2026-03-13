import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { SpendingClient } from './SpendingClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Spending & Efficiency' };

export default async function SpendingEfficiencyPage() {
  const [mspbDist, stateSummary, topAbove, topBelow, statesRaw] = await Promise.all([
    query<{ bucket: string; cnt: number }>(`
      SELECT CAST(ROUND(mspb_ratio * 20) / 20 AS VARCHAR) AS bucket,
             COUNT(*) AS cnt
      FROM v_mspb
      WHERE mspb_ratio IS NOT NULL
      GROUP BY ROUND(mspb_ratio * 20) / 20
      ORDER BY ROUND(mspb_ratio * 20) / 20
    `),
    query<{ state: string; avg_mspb: number | null; hospital_count: number }>(`
      SELECT state, ROUND(AVG(mspb_ratio), 3) AS avg_mspb, COUNT(*) AS hospital_count
      FROM v_mspb
      WHERE mspb_ratio IS NOT NULL
      GROUP BY state
      ORDER BY avg_mspb
    `),
    query<{ facility_id: string; facility_name: string; state: string; mspb_ratio: number | null }>(`
      SELECT facility_id, facility_name, state, mspb_ratio
      FROM v_mspb WHERE mspb_ratio IS NOT NULL ORDER BY mspb_ratio DESC LIMIT 10
    `),
    query<{ facility_id: string; facility_name: string; state: string; mspb_ratio: number | null }>(`
      SELECT facility_id, facility_name, state, mspb_ratio
      FROM v_mspb WHERE mspb_ratio IS NOT NULL ORDER BY mspb_ratio ASC LIMIT 10
    `),
    query<{ state: string }>(`SELECT DISTINCT state FROM v_mspb WHERE state IS NOT NULL ORDER BY state`),
  ]);

  const states = statesRaw.map((r) => r.state);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Spending &amp; Efficiency
          <InfoTooltip measureId="mspb" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Medicare Spending Per Beneficiary (MSPB) ratios compared to national averages. A ratio of 1.0 equals the national average.{' '}
          <a href="/about#spending" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>
      <SpendingClient
        mspbDist={mspbDist}
        stateSummary={stateSummary}
        topAbove={topAbove}
        topBelow={topBelow}
        states={states}
      />
    </div>
  );
}
