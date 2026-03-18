import ReactMarkdown from 'react-markdown';
import type { WidgetSpec } from '@/lib/agent/types';

interface TextWidgetProps {
  spec: WidgetSpec;
}

export function TextWidget({ spec }: TextWidgetProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
      <ReactMarkdown>{spec.content ?? ''}</ReactMarkdown>
    </div>
  );
}
