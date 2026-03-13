'use client';

import { useState } from 'react';

interface QueryViewerProps {
  sql: string;
}

export function QueryViewer({ sql }: QueryViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t pt-2">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        type="button"
      >
        SQL {open ? '▲' : '▾'}
      </button>
      {open && (
        <pre className="mt-2 rounded bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground">
          {sql}
        </pre>
      )}
    </div>
  );
}
