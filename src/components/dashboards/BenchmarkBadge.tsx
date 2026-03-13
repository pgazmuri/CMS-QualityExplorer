import { normalizeBenchmark, type BenchmarkLabel } from '@/types/hospital';
import { BENCHMARK_COLORS } from '@/lib/utils/color-scales';
import { cn } from '@/lib/utils';

interface BenchmarkBadgeProps {
  value: string | null | undefined;
  className?: string;
}

const LABEL_SHORT: Record<BenchmarkLabel, string> = {
  Better:  'Better',
  Same:    'No Diff',
  Worse:   'Worse',
  Unknown: 'N/A',
};

export function BenchmarkBadge({ value, className }: BenchmarkBadgeProps) {
  const label = normalizeBenchmark(value);
  const { tailwind } = BENCHMARK_COLORS[label];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', tailwind, className)}>
      {LABEL_SHORT[label]}
    </span>
  );
}
