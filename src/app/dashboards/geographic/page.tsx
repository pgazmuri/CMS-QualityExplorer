import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { GeographicClient } from './GeographicClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Geographic Atlas' };

export default async function GeographicPage() {
  const stateData = await query<{
    state: string;
    hospital_count: number;
    avg_star_rating: number | null;
    avg_mspb: number | null;
    hac_penalized_count: number;
    star_rank: number;
    mspb_rank: number;
    centroid_lat: number | null;
    centroid_lon: number | null;
  }>(`
    SELECT
      state,
      hospital_count,
      avg_star_rating,
      avg_mspb,
      hac_penalized_count,
      centroid_lat,
      centroid_lon,
      RANK() OVER (ORDER BY avg_star_rating DESC NULLS LAST) AS star_rank,
      RANK() OVER (ORDER BY avg_mspb ASC NULLS LAST)         AS mspb_rank
    FROM v_state_summary
    WHERE state IS NOT NULL
    ORDER BY avg_star_rating DESC NULLS LAST
  `);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Geographic Atlas
          <InfoTooltip text="State-level rankings of hospital quality metrics including star ratings, spending efficiency, and HAC penalties." />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          State-level rankings on star ratings, spending, HAC penalties, and readmission rates.{' '}
          <a href="/about#glossary" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>
      <GeographicClient stateData={stateData} />
    </div>
  );
}
