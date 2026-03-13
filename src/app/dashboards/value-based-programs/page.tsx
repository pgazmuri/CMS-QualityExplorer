import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Value-Based Programs' };

export default async function ValueBasedProgramsPage() {
  const [hvbpTop, hacSummary, hrrpByMeasure] = await Promise.all([
    query<{ facility_id: string; facility_name: string; state: string; tps: number | null; clinical_score: number | null; safety_score: number | null; engagement_score: number | null; efficiency_score: number | null }>(`
      SELECT facility_id, facility_name, state, tps,
             clinical_score, safety_score, engagement_score, efficiency_score
      FROM v_hvbp_tps
      WHERE tps IS NOT NULL
      ORDER BY tps DESC
      LIMIT 20
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
  ]);

  const hacPenalized = hacSummary.find((r) => r.payment_reduction === 'Yes');
  const hacNormal = hacSummary.find((r) => r.payment_reduction === 'No');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Value-Based Programs</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Hospital Value-Based Purchasing (HVBP) scores, HAC Reduction Program penalties, and
          Hospital Readmissions Reduction Program (HRRP) excess ratios.
        </p>
      </div>

      {/* HAC summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="HAC Penalized" value={(hacPenalized?.cnt ?? 0).toLocaleString()} sub="Payment reduction applied" />
        <SummaryCard label="HAC Not Penalized" value={(hacNormal?.cnt ?? 0).toLocaleString()} sub="No payment reduction" />
        <SummaryCard label="Avg HAC Score (Penalized)" value={hacPenalized?.avg_score?.toFixed(3) ?? 'N/A'} sub="" />
        <SummaryCard label="Avg HAC Score (Normal)" value={hacNormal?.avg_score?.toFixed(3) ?? 'N/A'} sub="" />
      </div>

      {/* HVBP top performers */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">HVBP Top 20 Total Performance Scores</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Hospital', 'State', 'TPS', 'Clinical', 'Safety', 'Engagement', 'Efficiency'].map((h) => (
                  <th key={h} className="text-right first:text-left pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hvbpTop.map((row) => (
                <tr key={row.facility_id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-1.5 font-medium max-w-[200px] truncate">{row.facility_name}</td>
                  <td className="py-1.5 text-right">{row.state}</td>
                  <td className="py-1.5 text-right font-bold font-mono text-blue-600">{row.tps?.toFixed(0) ?? 'N/A'}</td>
                  <td className="py-1.5 text-right font-mono">{row.clinical_score?.toFixed(1) ?? '—'}</td>
                  <td className="py-1.5 text-right font-mono">{row.safety_score?.toFixed(1) ?? '—'}</td>
                  <td className="py-1.5 text-right font-mono">{row.engagement_score?.toFixed(1) ?? '—'}</td>
                  <td className="py-1.5 text-right font-mono">{row.efficiency_score?.toFixed(1) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HRRP by measure */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">HRRP Excess Readmission Ratios by Condition</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Condition</th>
                <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Avg Excess Ratio</th>
                <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Hospitals</th>
                <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Ratio &gt; 1.0</th>
              </tr>
            </thead>
            <tbody>
              {hrrpByMeasure.map((row) => (
                <tr key={row.measure_name} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2">{row.measure_name.replace(/-HRRP$/, '')}</td>
                  <td className={`py-2 text-right font-mono font-medium ${(row.avg_excess ?? 0) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {row.avg_excess?.toFixed(4) ?? 'N/A'}
                  </td>
                  <td className="py-2 text-right">{row.hospital_count.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-600">{row.above_one.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>}
    </div>
  );
}
