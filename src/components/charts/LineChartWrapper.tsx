'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Label,
} from 'recharts';
import { CHART_COLORS } from '@/lib/utils/color-scales';

interface LineChartWrapperProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  referenceLine?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function LineChartWrapper({
  data,
  xKey,
  yKeys,
  colors,
  referenceLine,
  height = 300,
  xLabel,
  yLabel,
}: LineChartWrapperProps) {
  const resolvedColors = colors ?? CHART_COLORS;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 16, left: yLabel ? 24 : 8, bottom: xLabel ? 24 : 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }}>
          {xLabel && <Label value={xLabel} offset={-8} position="insideBottom" fontSize={12} />}
        </XAxis>
        <YAxis tick={{ fontSize: 12 }}>
          {yLabel && (
            <Label value={yLabel} angle={-90} position="insideLeft" offset={8} fontSize={12} />
          )}
        </YAxis>
        <Tooltip />
        {yKeys.length > 1 && <Legend />}
        {referenceLine != null && (
          <ReferenceLine
            y={referenceLine}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: String(referenceLine), fontSize: 11, fill: '#ef4444' }}
          />
        )}
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={resolvedColors[i % resolvedColors.length]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
