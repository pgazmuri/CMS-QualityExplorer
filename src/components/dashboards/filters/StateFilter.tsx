'use client';

interface StateFilterProps {
  value: string;
  onChange: (state: string) => void;
  states: string[];
  className?: string;
}

export function StateFilter({ value, onChange, states, className }: StateFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 ${className ?? ''}`}
      aria-label="Filter by state"
    >
      <option value="">All states</option>
      {states.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
