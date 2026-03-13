'use client';

import { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { MeasureFilter } from '@/components/dashboards/filters/MeasureFilter';

const MEASURE_LABELS: Record<string, string> = {
  'MORT_30_AMI': '30-Day Mortality: Heart Attack (AMI)',
  'MORT_30_HF': '30-Day Mortality: Heart Failure',
  'MORT_30_PN': '30-Day Mortality: Pneumonia',
  'MORT_30_COPD': '30-Day Mortality: COPD',
  'MORT_30_CABG': '30-Day Mortality: CABG',
  'COMP_HIP_KNEE': 'Complications: Hip/Knee Replacement',
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
}

interface Props {
  benchmarks: BenchmarkRow[];
  distribution: DistRow[];
}

export function ClinicalOutcomesClient({ benchmarks, distribution }: Props) {
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

  return (
    <>
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

      <div className="space-y-4">
        {filteredAndSorted.map((row) => {
          const dist = distMap[row.measure_id];
          const total = Number(row.better) + Number(row.same) + Number(row.worse);
          return (
            <div
              key={row.measure_id}
              className="rounded-xl border p-5"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-sm">
                    {MEASURE_LABELS[row.measure_id] ?? row.measure_id}
                    <InfoTooltip measureId={row.measure_id} size={12} />
                  </h3>
                  {row.national_rate != null && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      National rate: {row.national_rate.toFixed(1)}%
                    </p>
                  )}
                </div>
                {dist && (
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Avg: {dist.avg_score?.toFixed(1)}%</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Range: {dist.min_score?.toFixed(1)} – {dist.max_score?.toFixed(1)}</p>
                  </div>
                )}
              </div>

              {total > 0 && (
                <div className="mt-4">
                  <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
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
                  <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="text-green-600">↑ Better: {Number(row.better).toLocaleString()}</span>
                    <span>≈ Same: {Number(row.same).toLocaleString()}</span>
                    <span className="text-red-600">↓ Worse: {Number(row.worse).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
