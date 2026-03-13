export type WidgetType = 'metric' | 'chart' | 'table' | 'text';
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'radar';

export interface ColumnConfig {
  key: string;
  header: string;
  format?: 'number' | 'percent' | 'currency' | 'date' | 'badge' | 'ratio';
  sortable?: boolean;
}

export interface ChartConfig {
  xKey: string;
  yKeys: string[];
  colors?: string[];
  xLabel?: string;
  yLabel?: string;
  stacked?: boolean;
  showLegend?: boolean;
  referenceLines?: Array<{ value: number; label: string; color: string }>;
}

export interface WidgetSpec {
  id: string;
  type: WidgetType;
  title: string;
  sql?: string;
  chartType?: ChartType;
  chartConfig?: ChartConfig;
  columns?: ColumnConfig[];
  content?: string;
  metricKey?: string;
  format?: 'number' | 'percent' | 'currency' | 'ratio';
  comparison?: { value: number; label: string };
  width: 1 | 2 | 3;
  height: 1 | 2;
}

export interface WidgetData {
  rows: Record<string, unknown>[];
  isLoading: boolean;
  error: string | null;
}
