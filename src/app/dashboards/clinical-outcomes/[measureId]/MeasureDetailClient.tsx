'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';

interface StateAvgRow {
  state: string;
  avg_score: number;
  hospital_count: number;
  better: number;
  worse: number;
}

interface HospitalRow {
  facility_id: string;
  facility_name: string;
  state: string;
  score: number;
  compared_to_national: string;
  denominator: number | null;
}

interface BenchmarkDist {
  compared_to_national: string;
  cnt: number;
}

interface FinancialRow {
  facility_id: string;
  facility_name: string;
  state: string;
  score: number;
  mspb_ratio: number | null;
  star_rating: number | null;
}

interface Props {
  measureId: string;
  measureLabel: string;
  nationalRate: number | null;
  stateAvgs: StateAvgRow[];
  topHospitals: HospitalRow[];
  bottomHospitals: HospitalRow[];
  benchmarkDist: BenchmarkDist[];
  financialCorrelation: FinancialRow[];
}

function getBenchmarkCounts(dist: BenchmarkDist[]) {
  let better = 0, same = 0, worse = 0;
  for (const r of dist) {
    if (r.compared_to_national?.toLowerCase().includes('better')) better = Number(r.cnt);
    else if (r.compared_to_national?.toLowerCase().includes('no different')) same = Number(r.cnt);
    else if (r.compared_to_national?.toLowerCase().includes('worse')) worse = Number(r.cnt);
  }
  return { better, same, worse };
}

export function MeasureDetailClient({
  measureId,
  measureLabel,
  nationalRate,
  stateAvgs,
  topHospitals,
  bottomHospitals,
  benchmarkDist,
  financialCorrelation,
}: Props) {
  const [activeTab, setActiveTab] = useState<'geographic' | 'hospitals' | 'financial'>('geographic');
  const { better, same, worse } = getBenchmarkCounts(benchmarkDist);
  const total = better + same + worse;

  // Star rating breakdown
  const starBreakdown = useMemo(() => {
    const groups: Record<string, { count: number; avgScore: number; total: number }> = {};
    for (const r of financialCorrelation) {
      const key = r.star_rating != null ? `${r.star_rating} Star` : 'Unrated';
      if (!groups[key]) groups[key] = { count: 0, avgScore: 0, total: 0 };
      groups[key].count++;
      groups[key].total += r.score;
    }
    return Object.entries(groups)
      .map(([name, g]) => ({ name, avg_score: +(g.total / g.count).toFixed(2), hospitals: g.count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [financialCorrelation]);

  // Top 15 states chart data
  const stateChartData = useMemo(() => {
    const sorted = [...stateAvgs].sort((a, b) => a.avg_score - b.avg_score);
    return sorted.slice(0, 15).map((r) => ({
      state: r.state,
      avg_score: r.avg_score,
    }));
  }, [stateAvgs]);

  // MSPB correlation data (scatter-like: bucket by MSPB quintile)
  const mspbCorrelation = useMemo(() => {
    const withMSPB = financialCorrelation.filter((r) => r.mspb_ratio != null);
    if (withMSPB.length === 0) return [];
    const sorted = [...withMSPB].sort((a, b) => (a.mspb_ratio ?? 0) - (b.mspb_ratio ?? 0));
    const quintileSize = Math.ceil(sorted.length / 5);
    const labels = ['Lowest MSPB', 'Low MSPB', 'Mid MSPB', 'High MSPB', 'Highest MSPB'];
    return labels.map((label, i) => {
      const slice = sorted.slice(i * quintileSize, (i + 1) * quintileSize);
      const avgScore = slice.reduce((s, r) => s + r.score, 0) / (slice.length || 1);
      const avgMSPB = slice.reduce((s, r) => s + (r.mspb_ratio ?? 0), 0) / (slice.length || 1);
      return { name: label, avg_mortality: +avgScore.toFixed(2), avg_mspb: +avgMSPB.toFixed(3), hospitals: slice.length };
    });
  }, [financialCorrelation]);

  const hospitalColumns: DataTableColumn<HospitalRow>[] = [
    {
      key: 'facility_name', header: 'Hospital', sortable: true,
      render: (v, row) => (
        <Link href={`/dashboards/hospital-compass/${row.facility_id}`} className="font-medium text-blue-600 hover:underline">
          {v as string}
        </Link>
      ),
    },
    { key: 'state', header: 'State', sortable: true, align: 'center' },
    {
      key: 'score', header: 'Score (%)', sortable: true, align: 'right',
      render: (v) => <span className="font-mono font-medium">{(v as number).toFixed(1)}%</span>,
    },
    {
      key: 'compared_to_national', header: 'vs National', sortable: true, align: 'center',
      render: (v) => {
        const s = v as string;
        if (s?.toLowerCase().includes('better')) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Better</span>;
        if (s?.toLowerCase().includes('worse')) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Worse</span>;
        return <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Same</span>;
      },
    },
    {
      key: 'denominator', header: 'Cases', sortable: true, align: 'right',
      render: (v) => <span className="font-mono">{v != null ? (v as number).toLocaleString() : '—'}</span>,
    },
  ];

  const stateColumns: DataTableColumn<StateAvgRow>[] = [
    { key: 'state', header: 'State', sortable: true },
    {
      key: 'avg_score', header: 'Avg Rate (%)', sortable: true, align: 'right',
      render: (v) => <span className="font-mono font-medium">{(v as number).toFixed(2)}%</span>,
    },
    { key: 'hospital_count', header: 'Hospitals', sortable: true, align: 'right' },
    {
      key: 'better', header: 'Better', sortable: true, align: 'right',
      render: (v) => <span className="text-green-600 font-mono">{(v as number)}</span>,
    },
    {
      key: 'worse', header: 'Worse', sortable: true, align: 'right',
      render: (v) => <span className="text-red-600 font-mono">{(v as number)}</span>,
    },
  ];

  const tabs = [
    { id: 'geographic' as const, label: 'Geographic Analysis' },
    { id: 'hospitals' as const, label: 'Hospital Rankings' },
    { id: 'financial' as const, label: 'Financial Correlation' },
  ];

  return (
    <>
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="National Rate" value={nationalRate != null ? `${nationalRate.toFixed(1)}%` : 'N/A'} />
        <SummaryCard label="Better Than National" value={better.toLocaleString()} accent="text-green-600" />
        <SummaryCard label="No Different" value={same.toLocaleString()} accent="text-yellow-600" />
        <SummaryCard label="Worse Than National" value={worse.toLocaleString()} accent="text-red-600" />
      </div>

      {/* Benchmark bar */}
      {total > 0 && (
        <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-semibold text-sm mb-3">Performance Distribution</h2>
          <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
            <div style={{ width: `${(better / total) * 100}%`, background: '#22c55e' }} title={`Better: ${better}`} />
            <div style={{ width: `${(same / total) * 100}%`, background: '#eab308' }} title={`Same: ${same}`} />
            <div style={{ width: `${(worse / total) * 100}%`, background: '#ef4444' }} title={`Worse: ${worse}`} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span className="text-green-600">↑ Better: {((better / total) * 100).toFixed(1)}%</span>
            <span>≈ Same: {((same / total) * 100).toFixed(1)}%</span>
            <span className="text-red-600">↓ Worse: {((worse / total) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 rounded-lg p-1" style={{ background: 'var(--muted)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Geographic tab */}
      {activeTab === 'geographic' && (
        <div className="space-y-6">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h3 className="font-semibold text-sm mb-4">Best 15 States by Average Rate</h3>
            <BarChartWrapper
              data={stateChartData}
              xKey="state"
              yKeys={['avg_score']}
              colors={['#3b82f6']}
              yLabel={measureId.startsWith('COMP_') ? 'Complication Rate (%)' : 'Mortality Rate (%)'}
              referenceLine={nationalRate ?? undefined}
              height={320}
            />
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h3 className="font-semibold text-sm mb-4">All States</h3>
            <DataTable
              data={stateAvgs}
              columns={stateColumns}
              keyExtractor={(r) => r.state}
              defaultSort={{ key: 'avg_score', direction: 'asc' }}
              pageSize={15}
              maxHeight="450px"
            />
          </div>
        </div>
      )}

      {/* Hospital Rankings tab */}
      {activeTab === 'hospitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h3 className="font-semibold text-sm mb-4 text-green-600">Best Performing (Lowest Rate)</h3>
            <DataTable
              data={topHospitals}
              columns={hospitalColumns}
              keyExtractor={(r) => r.facility_id}
              pageSize={10}
            />
          </div>
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h3 className="font-semibold text-sm mb-4 text-red-600">Worst Performing (Highest Rate)</h3>
            <DataTable
              data={bottomHospitals}
              columns={hospitalColumns}
              keyExtractor={(r) => r.facility_id}
              pageSize={10}
            />
          </div>
        </div>
      )}

      {/* Financial Correlation tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {mspbCorrelation.length > 0 && (
            <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <h3 className="font-semibold text-sm mb-2">
                {measureId.startsWith('COMP_') ? 'Complication Rate' : 'Mortality Rate'} by Spending Quintile
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
                Hospitals grouped by Medicare Spending Per Beneficiary (MSPB) ratio into quintiles.
              </p>
              <BarChartWrapper
                data={mspbCorrelation}
                xKey="name"
                yKeys={['avg_mortality']}
                colors={['#8b5cf6']}
                yLabel={measureId.startsWith('COMP_') ? 'Avg Complication Rate (%)' : 'Avg Mortality Rate (%)'}
                referenceLine={nationalRate ?? undefined}
                height={300}
              />
            </div>
          )}

          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h3 className="font-semibold text-sm mb-2">
              {measureId.startsWith('COMP_') ? 'Complication Rate' : 'Mortality Rate'} by Star Rating
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Average rate grouped by overall hospital star rating.
            </p>
            <BarChartWrapper
              data={starBreakdown}
              xKey="name"
              yKeys={['avg_score']}
              colors={['#0ea5e9']}
              yLabel={measureId.startsWith('COMP_') ? 'Avg Complication Rate (%)' : 'Avg Mortality Rate (%)'}
              referenceLine={nationalRate ?? undefined}
              height={280}
            />
          </div>
        </div>
      )}
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
