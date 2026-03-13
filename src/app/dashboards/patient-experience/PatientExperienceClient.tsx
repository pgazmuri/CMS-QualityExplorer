'use client';

import { useState, useMemo } from 'react';
import { StarRatingBadge } from '@/components/dashboards/StarRatingBadge';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { MeasureFilter } from '@/components/dashboards/filters/MeasureFilter';

const HCAHPS_DOMAINS: Record<string, string> = {
  'H_COMP_1_STAR_RATING': 'Nurse Communication',
  'H_COMP_2_STAR_RATING': 'Doctor Communication',
  'H_COMP_3_STAR_RATING': 'Staff Responsiveness',
  'H_COMP_5_STAR_RATING': 'Communication About Medicines',
  'H_COMP_6_STAR_RATING': 'Discharge Information',
  'H_COMP_7_STAR_RATING': 'Care Transition',
  'H_CLEAN_STAR_RATING': 'Cleanliness',
  'H_QUIET_STAR_RATING': 'Quietness',
  'H_HSP_RATING_STAR_RATING': 'Overall Hospital Rating',
  'H_RECMND_STAR_RATING': 'Recommend Hospital',
  'H_STAR_RATING': 'Overall HCAHPS Star Rating',
};

interface DomainRow {
  measure_id: string;
  avg_stars: number | null;
  avg_linear: number | null;
  hospital_count: number;
}

interface StarDistRow {
  star_rating: number;
  cnt: number;
}

interface Props {
  starDist: StarDistRow[];
  domainAvgs: DomainRow[];
  totalRated: number;
  avgStarWeighted: number;
}

export function PatientExperienceClient({ starDist, domainAvgs, totalRated, avgStarWeighted }: Props) {
  const [measureFilter, setMeasureFilter] = useState('');

  const measures = Object.entries(HCAHPS_DOMAINS).map(([id, label]) => ({ id, label }));
  const hasFilters = measureFilter !== '';

  const filteredDomains = useMemo(() => {
    if (!measureFilter) return domainAvgs;
    return domainAvgs.filter((r) => r.measure_id === measureFilter);
  }, [domainAvgs, measureFilter]);

  const columns: DataTableColumn<DomainRow>[] = [
    {
      key: 'measure_id',
      header: 'Domain',
      sortable: true,
      render: (v) => (
        <span>
          {HCAHPS_DOMAINS[v as string] ?? (v as string)}
          <InfoTooltip measureId={v as string} size={12} />
        </span>
      ),
    },
    {
      key: 'avg_stars',
      header: 'Avg Stars',
      sortable: true,
      align: 'right',
      render: (v) =>
        v != null ? <StarRatingBadge rating={Math.round(v as number)} showLabel={false} /> : <span>N/A</span>,
    },
    {
      key: 'avg_linear',
      header: 'Linear Mean',
      sortable: true,
      align: 'right',
      tooltip: 'linear_mean',
      render: (v) => <span className="font-mono">{(v as number)?.toFixed(1) ?? 'N/A'}</span>,
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
      {/* Filters */}
      <FilterBar onReset={() => setMeasureFilter('')} showReset={hasFilters}>
        <MeasureFilter value={measureFilter} onChange={setMeasureFilter} measures={measures} allLabel="All domains" />
      </FilterBar>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Hospitals Rated" value={totalRated.toLocaleString()} />
        <SummaryCard label="Avg Overall Star" value={avgStarWeighted.toFixed(2)} />
        <SummaryCard label="5-Star Hospitals" value={(starDist.find((r) => r.star_rating === 5)?.cnt ?? 0).toLocaleString()} />
        <SummaryCard label="1-Star Hospitals" value={(starDist.find((r) => r.star_rating === 1)?.cnt ?? 0).toLocaleString()} />
      </div>

      {/* Star distribution */}
      <div className="rounded-xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          Overall Star Rating Distribution
          <InfoTooltip measureId="star_rating" side="right" />
        </h2>
        <div className="flex items-end gap-3 h-28">
          {[1, 2, 3, 4, 5].map((star) => {
            const row = starDist.find((r) => r.star_rating === star);
            const cnt = row ? Number(row.cnt) : 0;
            const maxCnt = Math.max(...starDist.map((r) => Number(r.cnt)));
            const height = maxCnt > 0 ? (cnt / maxCnt) * 100 : 0;
            const colors = ['', '#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e'];
            return (
              <div key={star} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-xs font-medium">{cnt.toLocaleString()}</span>
                <div
                  className="w-full rounded-t"
                  style={{ height: `${height}%`, minHeight: cnt > 0 ? 4 : 0, background: colors[star] }}
                />
                <span className="text-xs">{'★'.repeat(star)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain averages table — now sortable */}
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-semibold text-sm mb-4">
          Average Score by HCAHPS Domain
          <InfoTooltip measureId="hcahps" side="right" />
        </h2>
        <DataTable
          data={filteredDomains}
          columns={columns}
          keyExtractor={(row) => row.measure_id}
          defaultSort={{ key: 'avg_stars', direction: 'desc' }}
          pageSize={0}
        />
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
