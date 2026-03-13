'use client';

import { useAgentStore } from '@/lib/store/agent-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import { MetricWidget } from './MetricWidget';
import { TextWidget } from './TextWidget';

export function WidgetGrid() {
  const widgets = useAgentStore((s) => s.widgets);
  const widgetData = useAgentStore((s) => s.widgetData);

  if (widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Ask a question to generate visualizations.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {widgets.map((widget) => {
        const data = widgetData[widget.id] ?? { rows: [], isLoading: false, error: null };
        const colSpan = widget.width === 3 ? 'col-span-3' : widget.width === 2 ? 'col-span-2' : 'col-span-1';

        return (
          <div key={widget.id} className={colSpan}>
            <Card>
              <CardHeader>
                <CardTitle>{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {widget.type === 'chart' && (
                  <ChartWidget spec={widget} data={data} />
                )}
                {widget.type === 'table' && (
                  <TableWidget spec={widget} data={data} />
                )}
                {widget.type === 'metric' && (
                  <MetricWidget spec={widget} data={data} />
                )}
                {widget.type === 'text' && (
                  <TextWidget spec={widget} />
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
