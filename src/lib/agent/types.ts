export type WidgetType = 'metric' | 'chart' | 'table' | 'text' | 'map';
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

export interface MapConfig {
  latKey: string;
  lonKey: string;
  labelKey: string;
  colorKey?: string;
  sizeKey?: string;
}

export interface WidgetSpec {
  id: string;
  type: WidgetType;
  title: string;
  turnId?: string;
  sql?: string;
  chartType?: ChartType;
  chartConfig?: ChartConfig;
  mapConfig?: MapConfig;
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
  schema?: { name: string; type: string }[];
  isLoading: boolean;
  error: string | null;
}
