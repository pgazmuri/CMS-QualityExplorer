'use client';

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils/color-scales';

interface ScatterPlotWrapperProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  nameKey?: string;
  height?: number;
}

export function ScatterPlotWrapper({
  data,
  xKey,
  yKey,
  height = 300,
}: ScatterPlotWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 12 }} />
        <YAxis dataKey={yKey} name={yKey} tick={{ fontSize: 12 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter
          data={data}
          fill={CHART_COLORS[0]}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
