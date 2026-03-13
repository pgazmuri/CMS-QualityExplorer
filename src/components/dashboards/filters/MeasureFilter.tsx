'use client';

interface MeasureFilterProps {
  value: string;
  onChange: (measure: string) => void;
  measures: { id: string; label: string }[];
  className?: string;
  allLabel?: string;
}

export function MeasureFilter({ value, onChange, measures, className, allLabel = 'All measures' }: MeasureFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 ${className ?? ''}`}
      aria-label="Filter by measure"
    >
      <option value="">{allLabel}</option>
      {measures.map((m) => (
        <option key={m.id} value={m.id}>{m.label}</option>
      ))}
    </select>
  );
}
