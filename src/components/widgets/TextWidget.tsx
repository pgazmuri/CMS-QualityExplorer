import type { WidgetSpec } from '@/lib/agent/types';

interface TextWidgetProps {
  spec: WidgetSpec;
}

export function TextWidget({ spec }: TextWidgetProps) {
  return (
    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
      {spec.content ?? ''}
    </div>
  );
}
