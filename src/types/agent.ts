export type WidgetType = 'metric' | 'chart' | 'table' | 'text';
export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'radar';

export interface ColumnConfig {
  key: string;
  header: string;
  format?: 'number' | 'percent' | 'currency' | 'date' | 'badge' | 'ratio';
  width?: number;
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
  // SQL to be executed by the app (not the agent)
  sql?: string;
  // Chart fields
  chartType?: ChartType;
  chartConfig?: ChartConfig;
  // Table fields
  columns?: ColumnConfig[];
  // Text (markdown) fields
  content?: string;
  // Metric fields
  metricKey?: string;
  format?: 'number' | 'percent' | 'currency' | 'ratio';
  comparison?: { value: number; label: string };
  // Layout
  width: 1 | 2 | 3;
  height: 1 | 2;
}

export interface WidgetData {
  rows: Record<string, unknown>[];
  isLoading: boolean;
  error: string | null;
}

export interface AgentToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'call' | 'partial-call' | 'result';
  result?: WidgetSpec | unknown;
}
