import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { getMSPBColor } from '@/lib/utils/color-scales';
import { formatScore } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Spending & Efficiency' };

export default async function SpendingEfficiencyPage() {
  const [mspbDist, stateSummary, topAbove, topBelow] = await Promise.all([
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
  ]);

  const avgMSPB = stateSummary.reduce((s, r) => s + (r.avg_mspb ?? 0), 0) / (stateSummary.length || 1);
  const totalReporting = mspbDist.reduce((s, r) => s + Number(r.cnt), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Spending & Efficiency</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Medicare Spending Per Beneficiary (MSPB) ratio: 1.0 = national average.
          Values below 1.0 indicate more efficient spending.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Hospitals Reporting" value={totalReporting.toLocaleString()} />
        <SummaryCard label="Avg MSPB (by state)" value={avgMSPB.toFixed(3)} />
        <SummaryCard label="Below National Avg" value={`${mspbDist.filter((r) => parseFloat(r.bucket) < 1).reduce((s, r) => s + Number(r.cnt), 0).toLocaleString()}`} />
        <SummaryCard label="Above National Avg" value={`${mspbDist.filter((r) => parseFloat(r.bucket) > 1).reduce((s, r) => s + Number(r.cnt), 0).toLocaleString()}`} />
      </div>

      {/* State summary table */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">Average MSPB by State (sorted: most efficient first)</h2>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-xs">
            <thead className="sticky top-0" style={{ background: 'var(--card)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="text-left pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>State</th>
                <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Avg MSPB</th>
                <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Hospitals</th>
              </tr>
            </thead>
            <tbody>
              {stateSummary.map((row) => (
                <tr key={row.state} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-1.5 font-medium">{row.state}</td>
                  <td className={`py-1.5 text-right font-mono font-medium ${getMSPBColor(row.avg_mspb)}`}>
                    {row.avg_mspb?.toFixed(3) ?? 'N/A'}
                  </td>
                  <td className="py-1.5 text-right" style={{ color: 'var(--muted-foreground)' }}>{row.hospital_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top efficient & least efficient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HospitalMSPBTable title="Most Efficient (Lowest MSPB)" hospitals={topBelow} />
        <HospitalMSPBTable title="Least Efficient (Highest MSPB)" hospitals={topAbove} />
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

function HospitalMSPBTable({ title, hospitals }: {
  title: string;
  hospitals: { facility_id: string; facility_name: string; state: string; mspb_ratio: number | null }[];
}) {
  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <table className="w-full text-xs">
        <tbody>
          {hospitals.map((h) => (
            <tr key={h.facility_id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <td className="py-1.5">
                <p className="font-medium truncate max-w-[180px]">{h.facility_name}</p>
                <p style={{ color: 'var(--muted-foreground)' }}>{h.state}</p>
              </td>
              <td className={`py-1.5 text-right font-mono font-bold ${getMSPBColor(h.mspb_ratio)}`}>
                {h.mspb_ratio?.toFixed(3) ?? 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
