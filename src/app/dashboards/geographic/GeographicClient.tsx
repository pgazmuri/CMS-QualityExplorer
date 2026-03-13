'use client';

import { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { SearchInput } from '@/components/dashboards/filters/SearchInput';
import { getMSPBColor, STAR_COLORS } from '@/lib/utils/color-scales';

interface StateRow {
  state: string;
  hospital_count: number;
  avg_star_rating: number | null;
  avg_mspb: number | null;
  hac_penalized_count: number;
  star_rank: number;
  mspb_rank: number;
}

interface Props {
  stateData: StateRow[];
}

export function GeographicClient({ stateData }: Props) {
  const [search, setSearch] = useState('');
  const hasFilters = search !== '';

  const filtered = useMemo(() => {
    if (!search) return stateData;
    return stateData.filter((r) => r.state.toLowerCase().includes(search.toLowerCase()));
  }, [stateData, search]);

  const columns: DataTableColumn<StateRow>[] = [
    {
      key: 'star_rank',
      header: 'Star Rank',
      sortable: true,
      align: 'center',
      render: (v) => <span className="font-bold" style={{ color: 'var(--muted-foreground)' }}>#{v as number}</span>,
    },
    { key: 'state', header: 'State', sortable: true, render: (v) => <span className="font-semibold">{v as string}</span> },
    {
      key: 'hospital_count',
      header: 'Hospitals',
      sortable: true,
      align: 'right',
      render: (v) => (v as number).toLocaleString(),
    },
    {
      key: 'avg_star_rating',
      header: 'Avg Stars',
      sortable: true,
      tooltip: 'star_rating',
      render: (v) => {
        const val = v as number | null;
        const starColor = val != null
          ? STAR_COLORS[Math.min(5, Math.max(1, Math.round(val)))]
          : '#94a3b8';
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono" style={{ color: starColor }}>
              {val?.toFixed(2) ?? 'N/A'}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-16">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${((val ?? 0) / 5) * 100}%`, background: starColor }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'mspb_rank',
      header: 'MSPB Rank',
      sortable: true,
      align: 'center',
      render: (v) => <span style={{ color: 'var(--muted-foreground)' }}>#{v as number}</span>,
    },
    {
      key: 'avg_mspb',
      header: 'Avg MSPB',
      sortable: true,
      align: 'right',
      tooltip: 'mspb',
      render: (v) => (
        <span className={`font-mono font-semibold ${getMSPBColor(v as number | null)}`}>
          {(v as number)?.toFixed(3) ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'hac_penalized_count',
      header: 'HAC Penalized',
      sortable: true,
      align: 'right',
      tooltip: 'hac',
      render: (v) => {
        const count = v as number;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <span>{count}</span>
            {count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                penalized
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <FilterBar onReset={() => setSearch('')} showReset={hasFilters}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search state..." className="w-48" />
      </FilterBar>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(row) => row.state}
          defaultSort={{ key: 'avg_star_rating', direction: 'desc' }}
          pageSize={0}
        />
      </div>
    </>
  );
}
