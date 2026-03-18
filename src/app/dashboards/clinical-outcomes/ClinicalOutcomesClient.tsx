'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { MeasureFilter } from '@/components/dashboards/filters/MeasureFilter';
import { ChevronRight } from 'lucide-react';

const MEASURE_LABELS: Record<string, string> = {
  'MORT_30_AMI': 'Heart Attack (AMI)',
  'MORT_30_HF': 'Heart Failure',
  'MORT_30_PN': 'Pneumonia',
  'MORT_30_COPD': 'COPD',
  'MORT_30_CABG': 'CABG Surgery',
  'COMP_HIP_KNEE': 'Hip/Knee Complications',
};

const MEASURE_ICONS: Record<string, string> = {
  'MORT_30_AMI': '❤️',
  'MORT_30_HF': '💔',
  'MORT_30_PN': '🫁',
  'MORT_30_COPD': '🌬️',
  'MORT_30_CABG': '🔪',
  'COMP_HIP_KNEE': '🦴',
};

const SORT_OPTIONS = [
  { id: '', label: 'Default order' },
  { id: 'national_rate_asc', label: 'National rate (low → high)' },
  { id: 'national_rate_desc', label: 'National rate (high → low)' },
  { id: 'worse_desc', label: 'Most hospitals worse' },
  { id: 'better_desc', label: 'Most hospitals better' },
];

interface BenchmarkRow {
  measure_id: string;
  national_rate: number | null;
  better: number;
  same: number;
  worse: number;
}

interface DistRow {
  measure_id: string;
  avg_score: number | null;
  min_score: number | null;
  max_score: number | null;
  hospital_count: number;
}

interface Props {
  benchmarks: BenchmarkRow[];
  distribution: DistRow[];
  totalHospitals: number;
  totalBetter: number;
  totalSame: number;
  totalWorse: number;
}

export function ClinicalOutcomesClient({ benchmarks, distribution, totalHospitals, totalBetter, totalSame, totalWorse }: Props) {
  const [measureFilter, setMeasureFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  const measures = Object.entries(MEASURE_LABELS).map(([id, label]) => ({ id, label }));
  const distMap = Object.fromEntries(distribution.map((r) => [r.measure_id, r]));
  const hasFilters = measureFilter !== '' || sortBy !== '';

  const filteredAndSorted = useMemo(() => {
    let result = benchmarks;
    if (measureFilter) result = result.filter((r) => r.measure_id === measureFilter);
    if (sortBy) {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'national_rate_asc': return (a.national_rate ?? 0) - (b.national_rate ?? 0);
          case 'national_rate_desc': return (b.national_rate ?? 0) - (a.national_rate ?? 0);
          case 'worse_desc': return Number(b.worse) - Number(a.worse);
          case 'better_desc': return Number(b.better) - Number(a.better);
          default: return 0;
        }
      });
    }
    return result;
  }, [benchmarks, measureFilter, sortBy]);

  const totalAll = totalBetter + totalSame + totalWorse;

  return (
    <>
      {/* Aggregate summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Observations" value={totalHospitals.toLocaleString()} />
        <SummaryCard label="Better Than National" value={totalBetter.toLocaleString()} accent="text-green-600" />
        <SummaryCard label="No Different" value={totalSame.toLocaleString()} accent="text-yellow-600" />
        <SummaryCard label="Worse Than National" value={totalWorse.toLocaleString()} accent="text-red-600" />
      </div>

      {/* Aggregate stacked bar for all measures */}
      {totalAll > 0 && (
        <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-semibold text-sm mb-3">Overall Performance vs National Benchmarks</h2>
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            <div style={{ width: `${(totalBetter / totalAll) * 100}%`, background: '#22c55e' }} title={`Better: ${totalBetter.toLocaleString()}`} />
            <div style={{ width: `${(totalSame / totalAll) * 100}%`, background: '#eab308' }} title={`Same: ${totalSame.toLocaleString()}`} />
            <div style={{ width: `${(totalWorse / totalAll) * 100}%`, background: '#ef4444' }} title={`Worse: ${totalWorse.toLocaleString()}`} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="text-green-600">↑ Better: {((totalBetter / totalAll) * 100).toFixed(1)}%</span>
            <span>≈ Same: {((totalSame / totalAll) * 100).toFixed(1)}%</span>
            <span className="text-red-600">↓ Worse: {((totalWorse / totalAll) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      <FilterBar onReset={() => { setMeasureFilter(''); setSortBy(''); }} showReset={hasFilters}>
        <MeasureFilter value={measureFilter} onChange={setMeasureFilter} measures={measures} allLabel="All conditions" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAndSorted.map((row) => {
          const dist = distMap[row.measure_id];
          const total = Number(row.better) + Number(row.same) + Number(row.worse);
          const icon = MEASURE_ICONS[row.measure_id] ?? '📊';

          return (
            <Link
              key={row.measure_id}
              href={`/dashboards/clinical-outcomes/${row.measure_id}`}
              className="block group"
            >
              <div
                className="rounded-xl border p-5 h-full transition-colors group-hover:border-blue-400"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {MEASURE_LABELS[row.measure_id] ?? row.measure_id}
                        <InfoTooltip measureId={row.measure_id} size={12} />
                      </h3>
                      {row.national_rate != null && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          National rate: <strong>{row.national_rate.toFixed(1)}%</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {dist && (
                      <div className="text-right">
                        <p className="text-xs font-medium">{dist.avg_score?.toFixed(1)}%</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          {dist.min_score?.toFixed(1)} – {dist.max_score?.toFixed(1)}
                        </p>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                {total > 0 && (
                  <div className="mt-4">
                    <div className="flex h-3.5 rounded-full overflow-hidden gap-0.5">
                      {[
                        { k: 'better', color: '#22c55e', n: Number(row.better) },
                        { k: 'same', color: '#eab308', n: Number(row.same) },
                        { k: 'worse', color: '#ef4444', n: Number(row.worse) },
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
                    <div className="flex justify-between mt-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="text-green-600">↑ {Number(row.better).toLocaleString()}</span>
                      <span>≈ {Number(row.same).toLocaleString()}</span>
                      <span className="text-red-600">↓ {Number(row.worse).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className={`text-2xl font-bold ${accent ?? ''}`}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
    </div>
  );
}
