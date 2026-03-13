'use client';

import { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { StateFilter } from '@/components/dashboards/filters/StateFilter';
import { SearchInput } from '@/components/dashboards/filters/SearchInput';
import { getMSPBColor } from '@/lib/utils/color-scales';

interface StateSummaryRow {
  state: string;
  avg_mspb: number | null;
  hospital_count: number;
}

interface MSPBHospitalRow {
  facility_id: string;
  facility_name: string;
  state: string;
  mspb_ratio: number | null;
}

interface BucketRow {
  bucket: string;
  cnt: number;
}

interface Props {
  mspbDist: BucketRow[];
  stateSummary: StateSummaryRow[];
  topAbove: MSPBHospitalRow[];
  topBelow: MSPBHospitalRow[];
  states: string[];
}

export function SpendingClient({ mspbDist, stateSummary, topAbove, topBelow, states }: Props) {
  const [stateFilter, setStateFilter] = useState('');
  const [search, setSearch] = useState('');
  const hasFilters = stateFilter !== '' || search !== '';

  const avgMSPB = stateSummary.reduce((s, r) => s + (r.avg_mspb ?? 0), 0) / (stateSummary.length || 1);
  const totalReporting = mspbDist.reduce((s, r) => s + Number(r.cnt), 0);

  const filteredStates = useMemo(() => {
    if (!stateFilter) return stateSummary;
    return stateSummary.filter((r) => r.state === stateFilter);
  }, [stateSummary, stateFilter]);

  const filteredBelow = useMemo(() => {
    let result = topBelow;
    if (stateFilter) result = result.filter((h) => h.state === stateFilter);
    if (search) result = result.filter((h) => h.facility_name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [topBelow, stateFilter, search]);

  const filteredAbove = useMemo(() => {
    let result = topAbove;
    if (stateFilter) result = result.filter((h) => h.state === stateFilter);
    if (search) result = result.filter((h) => h.facility_name.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [topAbove, stateFilter, search]);

  const stateColumns: DataTableColumn<StateSummaryRow>[] = [
    { key: 'state', header: 'State', sortable: true },
    {
      key: 'avg_mspb',
      header: 'Avg MSPB',
      sortable: true,
      align: 'right',
      tooltip: 'mspb',
      render: (v) => (
        <span className={`font-mono font-medium ${getMSPBColor(v as number | null)}`}>
          {(v as number)?.toFixed(3) ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'hospital_count',
      header: 'Hospitals',
      sortable: true,
      align: 'right',
      render: (v) => <span style={{ color: 'var(--muted-foreground)' }}>{(v as number).toLocaleString()}</span>,
    },
  ];

  return (
    <>
      <FilterBar onReset={() => { setStateFilter(''); setSearch(''); }} showReset={hasFilters}>
        <StateFilter value={stateFilter} onChange={setStateFilter} states={states} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search hospitals..." className="w-48" />
      </FilterBar>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Hospitals Reporting" value={totalReporting.toLocaleString()} />
        <SummaryCard label="Avg MSPB (by state)" value={avgMSPB.toFixed(3)} />
        <SummaryCard label="Below National Avg" value={`${mspbDist.filter((r) => parseFloat(r.bucket) < 1).reduce((s, r) => s + Number(r.cnt), 0).toLocaleString()}`} />
        <SummaryCard label="Above National Avg" value={`${mspbDist.filter((r) => parseFloat(r.bucket) > 1).reduce((s, r) => s + Number(r.cnt), 0).toLocaleString()}`} />
      </div>

      {/* State summary table — now sortable */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          Average MSPB by State
          <InfoTooltip measureId="mspb" side="right" size={12} />
        </h2>
        <DataTable
          data={filteredStates}
          columns={stateColumns}
          keyExtractor={(row) => row.state}
          defaultSort={{ key: 'avg_mspb', direction: 'asc' }}
          pageSize={20}
          maxHeight="320px"
        />
      </div>

      {/* Top efficient & least efficient — now sortable + filterable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HospitalMSPBTable title="Most Efficient (Lowest MSPB)" hospitals={filteredBelow} />
        <HospitalMSPBTable title="Least Efficient (Highest MSPB)" hospitals={filteredAbove} />
      </div>
    </>
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
  const columns: DataTableColumn<{ facility_id: string; facility_name: string; state: string; mspb_ratio: number | null }>[] = [
    {
      key: 'facility_name',
      header: 'Hospital',
      sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-medium truncate max-w-[180px]">{v as string}</p>
          <p style={{ color: 'var(--muted-foreground)' }}>{row.state}</p>
        </div>
      ),
    },
    {
      key: 'mspb_ratio',
      header: 'MSPB',
      sortable: true,
      align: 'right',
      render: (v) => (
        <span className={`font-mono font-bold ${getMSPBColor(v as number | null)}`}>
          {(v as number)?.toFixed(3) ?? 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <DataTable
        data={hospitals}
        columns={columns}
        keyExtractor={(row) => row.facility_id}
        pageSize={10}
      />
    </div>
  );
}
