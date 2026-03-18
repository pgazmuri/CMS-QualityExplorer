'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { StateFilter } from '@/components/dashboards/filters/StateFilter';
import { MeasureFilter } from '@/components/dashboards/filters/MeasureFilter';
import { formatSIR } from '@/lib/utils/format';
import { getSIRColor } from '@/lib/utils/color-scales';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';

const HAI_LABELS: Record<string, string> = {
  HAI_1_SIR: 'CLABSI', HAI_2_SIR: 'CAUTI', HAI_3_SIR: 'SSI (Colon)',
  HAI_4_SIR: 'SSI (Abd)', HAI_5_SIR: 'MRSA', HAI_6_SIR: 'CDI',
};

const INFECTION_MEASURES = [
  { id: 'HAI_1_SIR', label: 'CLABSI' },
  { id: 'HAI_2_SIR', label: 'CAUTI' },
  { id: 'HAI_3_SIR', label: 'SSI (Colon)' },
  { id: 'HAI_4_SIR', label: 'SSI (Abd)' },
  { id: 'HAI_5_SIR', label: 'MRSA' },
  { id: 'HAI_6_SIR', label: 'CDI' },
];

interface NationalHAIRow {
  measure_id: string;
  avg_sir: number | null;
  hospital_count: number;
}

interface HACHospitalRow {
  facility_id: string;
  facility_name: string;
  state: string;
  hac_score: number | null;
  payment_reduction: string | null;
}

interface BenchmarkRow {
  compared_to_national: string;
  measure_id: string;
  cnt: number;
}

interface Props {
  nationalHAI: NationalHAIRow[];
  hacHospitals: HACHospitalRow[];
  benchmarkDist: BenchmarkRow[];
  states: string[];
  hacPenalized: number;
  hacTotal: number;
}

export function SafetyClient({
  nationalHAI,
  hacHospitals,
  benchmarkDist,
  states,
  hacPenalized,
  hacTotal,
}: Props) {
  const [stateFilter, setStateFilter] = useState('');
  const [measureFilter, setMeasureFilter] = useState('');

  const hasFilters = stateFilter !== '' || measureFilter !== '';

  // Filter HAC hospitals
  const filteredHACHospitals = useMemo(() => {
    let result = hacHospitals;
    if (stateFilter) result = result.filter((h) => h.state === stateFilter);
    return result;
  }, [hacHospitals, stateFilter]);

  // Filter national HAI by measure
  const filteredHAI = useMemo(() => {
    if (!measureFilter) return nationalHAI;
    return nationalHAI.filter((r) => r.measure_id === measureFilter);
  }, [nationalHAI, measureFilter]);

  // Chart data for SIR by infection type
  const chartData = useMemo(() => {
    return nationalHAI.map((r) => ({
      name: HAI_LABELS[r.measure_id] ?? r.measure_id,
      SIR: r.avg_sir ?? 0,
    }));
  }, [nationalHAI]);

  // HAC table columns
  const hacColumns: DataTableColumn<HACHospitalRow>[] = [
    { key: 'facility_name', header: 'Hospital', sortable: true,
      render: (v, row) => (
        <Link href={`/dashboards/hospital-compass/${row.facility_id}`} className="font-medium text-blue-600 hover:underline">
          {v as string}
        </Link>
      ),
    },
    { key: 'state', header: 'State', sortable: true, align: 'center' },
    {
      key: 'hac_score',
      header: 'HAC Score',
      sortable: true,
      align: 'right',
      tooltip: 'hac',
      render: (v) => (
        <span className="font-mono font-medium">
          {typeof v === 'number' ? v.toFixed(3) : '—'}
        </span>
      ),
    },
    {
      key: 'payment_reduction',
      header: 'Penalty',
      sortable: true,
      align: 'center',
      render: (v) =>
        v === 'Yes' ? (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Penalized
          </span>
        ) : (
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No</span>
        ),
    },
  ];

  return (
    <>
      {/* Filters */}
      <FilterBar onReset={() => { setStateFilter(''); setMeasureFilter(''); }} showReset={hasFilters}>
        <StateFilter value={stateFilter} onChange={setStateFilter} states={states} />
        <MeasureFilter value={measureFilter} onChange={setMeasureFilter} measures={INFECTION_MEASURES} allLabel="All infection types" />
      </FilterBar>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="HAC Penalized Hospitals" value={hacPenalized.toLocaleString()} tooltip="hac" />
        <SummaryCard label="HAC Total Evaluated" value={hacTotal.toLocaleString()} tooltip="hac" />
        <SummaryCard label="HAC Penalty Rate" value={hacTotal > 0 ? `${((hacPenalized / hacTotal) * 100).toFixed(1)}%` : 'N/A'} tooltip="hac" />
        <SummaryCard label="HAI Measures Tracked" value="6" tooltip="sir" />
      </div>

      {/* National HAI SIR averages */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          National Average SIR by Infection Type
          <InfoTooltip measureId="sir" side="right" />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredHAI.map((r) => (
            <div key={r.measure_id} className="text-center">
              <p className={`text-2xl font-bold font-mono ${getSIRColor(r.avg_sir)}`}>
                {formatSIR(r.avg_sir)}
              </p>
              <p className="text-xs mt-1 font-medium">
                {HAI_LABELS[r.measure_id] ?? r.measure_id}
                <InfoTooltip measureId={r.measure_id} size={12} />
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.hospital_count.toLocaleString()} hospitals</p>
            </div>
          ))}
        </div>
      </div>

      {/* SIR Bar Chart */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">National Average SIR by Infection Type (Chart)</h2>
        <BarChartWrapper
          data={chartData}
          xKey="name"
          yKeys={['SIR']}
          height={250}
          referenceLine={1.0}
        />
      </div>

      {/* HAC Leaderboard */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          HAC Reduction Program — Hospital Scores
          <InfoTooltip measureId="hac" side="right" />
        </h2>
        <DataTable
          data={filteredHACHospitals}
          columns={hacColumns}
          keyExtractor={(row) => row.facility_id}
          defaultSort={{ key: 'hac_score', direction: 'desc' }}
          pageSize={20}
        />
      </div>
    </>
  );
}

function SummaryCard({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {label}
        {tooltip && <InfoTooltip measureId={tooltip} size={12} />}
      </p>
    </div>
  );
}
