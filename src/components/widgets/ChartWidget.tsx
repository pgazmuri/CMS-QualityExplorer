'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';
import { LineChartWrapper } from '@/components/charts/LineChartWrapper';
import { ScatterPlotWrapper } from '@/components/charts/ScatterPlotWrapper';
import { QueryViewer } from './QueryViewer';
import type { WidgetSpec, WidgetData } from '@/lib/agent/types';

interface ChartWidgetProps {
  spec: WidgetSpec;
  data: WidgetData;
}

export function ChartWidget({ spec, data }: ChartWidgetProps) {
  if (data.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
        Error loading chart: {data.error}
      </div>
    );
  }

  const cfg = spec.chartConfig;

  if (!cfg) {
    return (
      <div className="text-sm text-muted-foreground">
        No chart configuration provided.
      </div>
    );
  }

  const chartType = spec.chartType ?? 'bar';

  return (
    <div>
      {chartType === 'bar' && (
        <BarChartWrapper
          data={data.rows}
          xKey={cfg.xKey}
          yKeys={cfg.yKeys}
          colors={cfg.colors}
          xLabel={cfg.xLabel}
          yLabel={cfg.yLabel}
          referenceLine={cfg.referenceLines?.[0]?.value}
        />
      )}
      {chartType === 'line' && (
        <LineChartWrapper
          data={data.rows}
          xKey={cfg.xKey}
          yKeys={cfg.yKeys}
          colors={cfg.colors}
          xLabel={cfg.xLabel}
          yLabel={cfg.yLabel}
          referenceLine={cfg.referenceLines?.[0]?.value}
        />
      )}
      {chartType === 'scatter' && (
        <ScatterPlotWrapper
          data={data.rows}
          xKey={cfg.xKey}
          yKey={cfg.yKeys[0] ?? ''}
        />
      )}
      {!['bar', 'line', 'scatter'].includes(chartType) && (
        <div className="text-sm text-muted-foreground">
          Unsupported chart type: {chartType}
        </div>
      )}
      {spec.sql && <QueryViewer sql={spec.sql} />}
    </div>
  );
}
