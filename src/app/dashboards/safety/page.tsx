import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { BenchmarkBadge } from '@/components/dashboards/BenchmarkBadge';
import { formatSIR } from '@/lib/utils/format';
import { getSIRColor } from '@/lib/utils/color-scales';
import { SafetyCharts } from './SafetyCharts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Safety Observatory' };

const HAI_LABELS: Record<string, string> = {
  HAI_1_SIR: 'CLABSI', HAI_2_SIR: 'CAUTI', HAI_3_SIR: 'SSI (Colon)',
  HAI_4_SIR: 'SSI (Abd)', HAI_5_SIR: 'MRSA', HAI_6_SIR: 'CDI',
  HAI_1: 'CLABSI', HAI_2: 'CAUTI', HAI_3: 'SSI (Colon)',
  HAI_4: 'SSI (Abd)', HAI_5: 'MRSA', HAI_6: 'CDI',
};

export default async function SafetyPage() {
  const [nationalHAI, hacSummary, benchmarkDist] = await Promise.all([
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
  ]);

  const hacPenalized = hacSummary.find((r) => r.payment_reduction === 'Yes')?.cnt ?? 0;
  const hacTotal = hacSummary.reduce((s, r) => s + Number(r.cnt), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Safety Observatory</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Healthcare-associated infections, HAC program scores, and patient safety indicators.
          SIR values below 1.0 indicate fewer infections than expected.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="HAC Penalized Hospitals" value={hacPenalized.toLocaleString()} />
        <SummaryCard label="HAC Total Evaluated" value={hacTotal.toLocaleString()} />
        <SummaryCard label="HAC Penalty Rate" value={hacTotal > 0 ? `${((hacPenalized / hacTotal) * 100).toFixed(1)}%` : 'N/A'} />
        <SummaryCard label="HAI Measures Tracked" value="6" />
      </div>

      {/* National HAI SIR averages */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">National Average SIR by Infection Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {nationalHAI.map((r) => (
            <div key={r.measure_id} className="text-center">
              <p className={`text-2xl font-bold font-mono ${getSIRColor(r.avg_sir)}`}>
                {formatSIR(r.avg_sir)}
              </p>
              <p className="text-xs mt-1 font-medium">{HAI_LABELS[r.measure_id] ?? r.measure_id}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.hospital_count.toLocaleString()} hospitals</p>
            </div>
          ))}
        </div>
      </div>

      <SafetyCharts />
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
