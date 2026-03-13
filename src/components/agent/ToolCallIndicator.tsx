'use client';

import { Loader2, CheckCircle2 } from 'lucide-react';

const TOOL_LABELS: Record<string, string> = {
  search_hospitals: 'Searching hospitals',
  get_schema_info: 'Reading schema',
  get_benchmarks: 'Fetching benchmarks',
  create_chart_widget: 'Creating chart',
  create_table_widget: 'Creating table',
  create_metric_widget: 'Creating metric',
  create_text_widget: 'Creating text',
};

interface ToolCallIndicatorProps {
  toolName: string;
  args: Record<string, unknown>;
  state: 'partial-call' | 'call' | 'result';
}

export function ToolCallIndicator({ toolName, args, state }: ToolCallIndicatorProps) {
  const label = TOOL_LABELS[toolName] ?? toolName;
  const isDone = state === 'result';

  return (
    <div className="flex items-center gap-2 text-xs py-1">
      {isDone ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
      )}
      <span className={isDone ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
      {typeof args.title === 'string' && args.title && (
        <span className="text-muted-foreground truncate max-w-[200px]">&ldquo;{args.title}&rdquo;</span>
      )}
    </div>
  );
}
