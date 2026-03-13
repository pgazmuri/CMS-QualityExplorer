import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { SafetyClient } from './SafetyClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Safety Observatory' };

export default async function SafetyPage() {
  const [nationalHAI, hacSummary, benchmarkDist, hacHospitals, statesResult] = await Promise.all([
    query<{ measure_id: string; avg_sir: number | null; hospital_count: number }>(`
      SELECT measure_id,
             ROUND(AVG(sir_value), 3) AS avg_sir,
             COUNT(*) AS hospital_count
      FROM v_hai_sir
      WHERE sir_value IS NOT NULL
      GROUP BY measure_id
      ORDER BY measure_id
    `),
    query<{ payment_reduction: string; cnt: number }>(`
      SELECT payment_reduction, COUNT(*) AS cnt
      FROM v_hac
      WHERE payment_reduction IS NOT NULL
      GROUP BY payment_reduction
    `),
    query<{ compared_to_national: string; measure_id: string; cnt: number }>(`
      SELECT compared_to_national, measure_id, COUNT(*) AS cnt
      FROM v_hai_sir
      WHERE compared_to_national IS NOT NULL
      GROUP BY compared_to_national, measure_id
      ORDER BY measure_id, cnt DESC
    `),
    query<{ facility_id: string; facility_name: string; state: string; hac_score: number | null; payment_reduction: string | null }>(`
      SELECT facility_id, facility_name, state, hac_score, payment_reduction
      FROM v_hac
      WHERE payment_reduction IS NOT NULL
      ORDER BY hac_score DESC
    `),
    query<{ state: string }>(`
      SELECT DISTINCT state FROM v_hac WHERE state IS NOT NULL ORDER BY state
    `),
  ]);

  const hacPenalized = hacSummary.find((r) => r.payment_reduction === 'Yes')?.cnt ?? 0;
  const hacTotal = hacSummary.reduce((s, r) => s + Number(r.cnt), 0);
  const states = statesResult.map((r) => r.state);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Safety Observatory
          <InfoTooltip text="This dashboard tracks healthcare-associated infections (HAIs) and the Hospital-Acquired Condition (HAC) Reduction Program. HAIs are infections patients acquire during hospital care." aboutAnchor="safety-hai" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Healthcare-associated infections, HAC program scores, and patient safety indicators.
          SIR values below 1.0 indicate fewer infections than expected.{' '}
          <a href="/about#safety-hai" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>

      <SafetyClient
        nationalHAI={nationalHAI}
        hacHospitals={hacHospitals}
        benchmarkDist={benchmarkDist}
        states={states}
        hacPenalized={hacPenalized}
        hacTotal={hacTotal}
      />
    </div>
  );
}
