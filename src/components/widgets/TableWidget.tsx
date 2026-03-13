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
                  {formatByType(row[col.key], (col as { format?: 'number' | 'percent' | 'currency' | 'date' | 'badge' | 'ratio' }).format)}
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
