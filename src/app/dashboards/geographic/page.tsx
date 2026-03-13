import type { Metadata } from 'next';
import { query } from '@/lib/duckdb/instance';
import { getMSPBColor, STAR_COLORS } from '@/lib/utils/color-scales';

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
  }>(`
    SELECT
      state,
      hospital_count,
      avg_star_rating,
      avg_mspb,
      hac_penalized_count,
      RANK() OVER (ORDER BY avg_star_rating DESC NULLS LAST) AS star_rank,
      RANK() OVER (ORDER BY avg_mspb ASC NULLS LAST)         AS mspb_rank
    FROM v_state_summary
    WHERE state IS NOT NULL
    ORDER BY avg_star_rating DESC NULLS LAST
  `);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Geographic Atlas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          State-level rankings on star ratings, spending efficiency, and HAC penalties.
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--muted)' }}>
              <tr>
                {['Star Rank', 'State', 'Hospitals', 'Avg Stars', 'MSPB Rank', 'Avg MSPB', 'HAC Penalized'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stateData.map((row, i) => {
                const starColor = row.avg_star_rating != null
                  ? STAR_COLORS[Math.min(5, Math.max(1, Math.round(row.avg_star_rating)))]
                  : '#94a3b8';
                return (
                  <tr
                    key={row.state}
                    className="border-b last:border-0"
                    style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--card)' : 'var(--muted)' }}
                  >
                    <td className="px-4 py-2.5 text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>#{row.star_rank}</td>
                    <td className="px-4 py-2.5 font-semibold">{row.state}</td>
                    <td className="px-4 py-2.5 text-right">{row.hospital_count.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono" style={{ color: starColor }}>
                          {row.avg_star_rating?.toFixed(2) ?? 'N/A'}
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-16">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${((row.avg_star_rating ?? 0) / 5) * 100}%`, background: starColor }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>#{row.mspb_rank}</td>
                    <td className={`px-4 py-2.5 font-mono font-semibold ${getMSPBColor(row.avg_mspb)}`}>
                      {row.avg_mspb?.toFixed(3) ?? 'N/A'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span>{row.hac_penalized_count}</span>
                        {row.hac_penalized_count > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            penalized
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
