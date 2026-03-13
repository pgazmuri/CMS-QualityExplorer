'use client';

import { useState, useMemo } from 'react';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { StateFilter } from '@/components/dashboards/filters/StateFilter';

interface HVBPRow {
  facility_id: string;
  facility_name: string;
  state: string;
  tps: number | null;
  clinical_score: number | null;
  safety_score: number | null;
  engagement_score: number | null;
  efficiency_score: number | null;
}

interface HACRow {
  payment_reduction: string;
  cnt: number;
  avg_score: number | null;
}

interface HRRPRow {
  measure_name: string;
  avg_excess: number | null;
  hospital_count: number;
  above_one: number;
}

interface Props {
  hvbpTop: HVBPRow[];
  hacSummary: HACRow[];
  hrrpByMeasure: HRRPRow[];
  states: string[];
  hacPenalized: HACRow | undefined;
  hacNormal: HACRow | undefined;
}

export function VBPClient({ hvbpTop, hacSummary, hrrpByMeasure, states, hacPenalized, hacNormal }: Props) {
  const [stateFilter, setStateFilter] = useState('');
  const hasFilters = stateFilter !== '';

  const filteredHVBP = useMemo(() => {
    if (!stateFilter) return hvbpTop;
    return hvbpTop.filter((r) => r.state === stateFilter);
  }, [hvbpTop, stateFilter]);

  const hvbpColumns: DataTableColumn<HVBPRow>[] = [
    {
      key: 'facility_name',
      header: 'Hospital',
      sortable: true,
      render: (v) => <span className="font-medium max-w-[200px] truncate block">{v as string}</span>,
    },
    { key: 'state', header: 'State', sortable: true, align: 'right' as const },
    {
      key: 'tps',
      header: 'TPS',
      sortable: true,
      align: 'right' as const,
      tooltip: 'tps',
      render: (v) => <span className="font-bold font-mono text-blue-600">{(v as number)?.toFixed(0) ?? 'N/A'}</span>,
    },
    {
      key: 'clinical_score',
      header: 'Clinical',
      sortable: true,
      align: 'right' as const,
      tooltip: 'hvbp_clinical',
      render: (v) => <span className="font-mono">{(v as number)?.toFixed(1) ?? '—'}</span>,
    },
    {
      key: 'safety_score',
      header: 'Safety',
      sortable: true,
      align: 'right' as const,
      tooltip: 'hvbp_safety',
      render: (v) => <span className="font-mono">{(v as number)?.toFixed(1) ?? '—'}</span>,
    },
    {
      key: 'engagement_score',
      header: 'Engagement',
      sortable: true,
      align: 'right' as const,
      tooltip: 'hvbp_engagement',
      render: (v) => <span className="font-mono">{(v as number)?.toFixed(1) ?? '—'}</span>,
    },
    {
      key: 'efficiency_score',
      header: 'Efficiency',
      sortable: true,
      align: 'right' as const,
      tooltip: 'hvbp_efficiency',
      render: (v) => <span className="font-mono">{(v as number)?.toFixed(1) ?? '—'}</span>,
    },
  ];

  const hrrpColumns: DataTableColumn<HRRPRow>[] = [
    {
      key: 'measure_name',
      header: 'Condition',
      sortable: true,
      render: (v) => (v as string).replace(/-HRRP$/, ''),
    },
    {
      key: 'avg_excess',
      header: 'Avg Excess Ratio',
      sortable: true,
      align: 'right',
      tooltip: 'excess_readmission_ratio',
      render: (v) => (
        <span className={`font-mono font-medium ${(v as number ?? 0) > 1 ? 'text-red-600' : 'text-green-600'}`}>
          {(v as number)?.toFixed(4) ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'hospital_count',
      header: 'Hospitals',
      sortable: true,
      align: 'right',
      render: (v) => (v as number).toLocaleString(),
    },
    {
      key: 'above_one',
      header: 'Ratio > 1.0',
      sortable: true,
      align: 'right',
      render: (v) => <span className="text-red-600">{(v as number).toLocaleString()}</span>,
    },
  ];

  return (
    <>
      <FilterBar onReset={() => setStateFilter('')} showReset={hasFilters}>
        <StateFilter value={stateFilter} onChange={setStateFilter} states={states} />
      </FilterBar>

      {/* HAC summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="HAC Penalized" value={(hacPenalized?.cnt ?? 0).toLocaleString()} sub="Payment reduction applied" />
        <SummaryCard label="HAC Not Penalized" value={(hacNormal?.cnt ?? 0).toLocaleString()} sub="No payment reduction" />
        <SummaryCard label="Avg HAC Score (Penalized)" value={hacPenalized?.avg_score?.toFixed(3) ?? 'N/A'} sub="" />
        <SummaryCard label="Avg HAC Score (Normal)" value={hacNormal?.avg_score?.toFixed(3) ?? 'N/A'} sub="" />
      </div>

      {/* HVBP top performers — now sortable + filterable */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          HVBP Top Performance Scores
          <InfoTooltip measureId="tps" side="right" />
        </h2>
        <DataTable
          data={filteredHVBP}
          columns={hvbpColumns}
          keyExtractor={(row) => row.facility_id}
          defaultSort={{ key: 'tps', direction: 'desc' }}
          pageSize={20}
        />
      </div>

      {/* HRRP by measure — now sortable */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          HRRP Excess Readmission Ratios by Condition
          <InfoTooltip measureId="hrrp" side="right" />
        </h2>
        <DataTable
          data={hrrpByMeasure}
          columns={hrrpColumns}
          keyExtractor={(row) => row.measure_name}
          pageSize={0}
        />
      </div>
    </>
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
