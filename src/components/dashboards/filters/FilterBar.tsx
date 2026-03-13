'use client';

import { X } from 'lucide-react';

interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
}

export function FilterBar({ children, onReset, showReset }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {children}
      {showReset && onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-input text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Clear filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
