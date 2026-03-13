'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { formatByType } from '@/lib/utils/format';
import type { WidgetSpec, WidgetData } from '@/lib/agent/types';

interface MetricWidgetProps {
  spec: WidgetSpec;
  data: WidgetData;
}

export function MetricWidget({ spec, data }: MetricWidgetProps) {
  if (data.isLoading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
        Error loading metric: {data.error}
      </div>
    );
  }

  const metricKey = spec.metricKey ?? '';
  const rawValue = data.rows[0]?.[metricKey];
  const formatted = formatByType(rawValue, spec.format);
  const numericValue = Number(rawValue);

  const comparison = spec.comparison;
  const isAbove = comparison != null && !isNaN(numericValue) && numericValue > comparison.value;
  const isBelow = comparison != null && !isNaN(numericValue) && numericValue < comparison.value;

  return (
    <div className="py-2">
      <div className="text-3xl font-bold tabular-nums">{formatted}</div>
      {comparison && (
        <div className="mt-1 flex items-center gap-1 text-sm">
          <span
            className={
              isAbove
                ? 'text-green-600 dark:text-green-400'
                : isBelow
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
            }
          >
            {isAbove ? '▲' : isBelow ? '▼' : '–'}
          </span>
          <span className="text-muted-foreground">
            {comparison.label} ({formatByType(comparison.value, spec.format)})
          </span>
        </div>
      )}
    </div>
  );
}
