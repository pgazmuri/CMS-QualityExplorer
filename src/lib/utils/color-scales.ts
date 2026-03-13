import { type BenchmarkLabel } from '@/types/hospital';

export const BENCHMARK_COLORS: Record<BenchmarkLabel, { tailwind: string; hex: string }> = {
  Better:  { tailwind: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', hex: '#166534' },
  Same:    { tailwind: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', hex: '#854d0e' },
  Worse:   { tailwind: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', hex: '#991b1b' },
  Unknown: { tailwind: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', hex: '#374151' },
};

/**
 * SIR < 1 = fewer infections than expected (good = green)
 * SIR ≈ 1 = as expected (yellow)
 * SIR > 1 = more infections than expected (bad = red)
 */
export function getSIRColor(sir: number | null | undefined): string {
  if (sir == null) return 'text-muted-foreground';
  if (sir < 0.7)  return 'text-green-600 dark:text-green-400';
  if (sir < 1.0)  return 'text-green-500 dark:text-green-500';
  if (sir < 1.1)  return 'text-yellow-600 dark:text-yellow-400';
  if (sir < 1.3)  return 'text-orange-500 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/** Star rating colors: index 1–5 */
export const STAR_COLORS = [
  '',                     // 0 (unused)
  '#dc2626',              // 1 star - red
  '#f97316',              // 2 stars - orange
  '#eab308',              // 3 stars - yellow
  '#84cc16',              // 4 stars - lime
  '#22c55e',              // 5 stars - green
];

/** MSPB ratio color coding (1.0 = national average) */
export function getMSPBColor(ratio: number | null | undefined): string {
  if (ratio == null) return 'text-muted-foreground';
  if (ratio < 0.97)  return 'text-green-600 dark:text-green-400';
  if (ratio <= 1.03) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/** Chart color palette */
export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];
