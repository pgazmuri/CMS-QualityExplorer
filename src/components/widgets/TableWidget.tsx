'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatByType } from '@/lib/utils/format';
import { QueryViewer } from './QueryViewer';
import type { WidgetSpec, WidgetData } from '@/lib/agent/types';
import Link from 'next/link';

interface TableWidgetProps {
  spec: WidgetSpec;
  data: WidgetData;
}

export function TableWidget({ spec, data }: TableWidgetProps) {
  if (data.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
        Error loading table: {data.error}
      </div>
    );
  }

  if (data.rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No data available.
      </div>
    );
  }

  const columns =
    spec.columns && spec.columns.length > 0
      ? spec.columns
      : Object.keys(data.rows[0]).map((key) => ({ key, header: key }));

  // Auto-detect if rows have facility_id to enable hospital linking
  const hasFacilityId = data.rows.length > 0 && 'facility_id' in data.rows[0];

  const renderCell = (row: Record<string, unknown>, col: { key: string; format?: 'number' | 'percent' | 'currency' | 'date' | 'badge' | 'ratio' }) => {
    const value = row[col.key];
    const formatted = formatByType(value, col.format);
    if (hasFacilityId && col.key === 'facility_name' && row.facility_id) {
      return (
        <Link href={`/dashboards/hospital-compass/${row.facility_id}`} className="text-blue-600 hover:underline">
          {formatted}
        </Link>
      );
    }
    return formatted;
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {renderCell(row, col as { key: string; format?: 'number' | 'percent' | 'currency' | 'date' | 'badge' | 'ratio' })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={columns.length} className="text-xs text-muted-foreground">
              {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      {spec.sql && <QueryViewer sql={spec.sql} />}
    </div>
  );
}
