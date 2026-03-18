'use client';

import { useMemo } from 'react';
import { useAgentStore } from '@/lib/store/agent-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import { MetricWidget } from './MetricWidget';
import { TextWidget } from './TextWidget';
import { MapWidget } from './MapWidget';

export function WidgetGrid() {
  const widgets = useAgentStore((s) => s.widgets);
  const widgetData = useAgentStore((s) => s.widgetData);

  // Group widgets by turnId, preserving order
  const turns = useMemo(() => {
    const groups: { turnId: string; widgets: typeof widgets }[] = [];
    const turnMap = new Map<string, typeof widgets>();
    for (const w of widgets) {
      const tid = w.turnId ?? 'default';
      if (!turnMap.has(tid)) {
        const arr: typeof widgets = [];
        turnMap.set(tid, arr);
        groups.push({ turnId: tid, widgets: arr });
      }
      turnMap.get(tid)!.push(w);
    }
    return groups;
  }, [widgets]);

  if (widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Ask a question to generate visualizations.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {turns.map((turn, turnIdx) => (
        <div key={turn.turnId}>
          {turns.length > 1 && turnIdx > 0 && (
            <div className="border-t mb-4" style={{ borderColor: 'var(--border)' }} />
          )}
          <div className="grid grid-cols-3 gap-4">
            {turn.widgets.map((widget) => {
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
                      {widget.type === 'map' && (
                        <MapWidget spec={widget} data={data} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
