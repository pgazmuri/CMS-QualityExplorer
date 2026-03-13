'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

export interface DataTableColumn<T> {
  key: keyof T & string;
  header: string;
  /** Render custom cell content */
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  /** Text alignment */
  align?: 'left' | 'right' | 'center';
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Measure glossary ID for tooltip on column header */
  tooltip?: string;
  /** Custom tooltip text */
  tooltipText?: string;
  /** CSS class for the column */
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Rows per page. Set 0 to disable pagination. */
  pageSize?: number;
  /** Default sort */
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  /** Unique key extractor */
  keyExtractor: (row: T) => string;
  /** Show row count at bottom */
  showRowCount?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Max height with scroll */
  maxHeight?: string;
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

export function DataTable<T extends AnyRow>({
  data,
  columns,
  pageSize = 25,
  defaultSort,
  keyExtractor,
  showRowCount = true,
  emptyMessage = 'No data available',
  maxHeight,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(defaultSort ?? null);
  const [page, setPage] = useState(0);

  // Sort data
  const sorted = useMemo(() => {
    if (!sort) return data;
    const { key, direction } = sort;
    return [...data].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return direction === 'asc' ? av - bv : bv - av;
      }
      const sa = String(av);
      const sb = String(bv);
      return direction === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [data, sort]);

  // Paginate
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);
  const paginated = pageSize > 0 ? sorted.slice(safePage * pageSize, (safePage + 1) * pageSize) : sorted;

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null; // third click clears sort
    });
    setPage(0);
  }

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sort?.key !== columnKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.direction === 'asc'
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full text-sm">
          <thead className="sticky top-0" style={{ background: 'var(--card)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`pb-2 pt-1 font-medium text-xs ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''} ${col.className ?? ''}`}
                  style={{ color: 'var(--muted-foreground)' }}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  aria-sort={sort?.key === col.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.tooltip && <InfoTooltip measureId={col.tooltip} size={12} />}
                    {col.tooltipText && <InfoTooltip text={col.tooltipText} size={12} />}
                    {col.sortable && <SortIcon columnKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-1.5 text-xs ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className ?? ''}`}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: row count + pagination */}
      {(showRowCount || (pageSize > 0 && totalPages > 1)) && (
        <div className="flex items-center justify-between mt-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>
            {showRowCount && (
              pageSize > 0
                ? `Showing ${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, sorted.length)} of ${sorted.length}`
                : `${sorted.length} rows`
            )}
          </span>

          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">
                {safePage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
