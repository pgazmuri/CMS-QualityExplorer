'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';

interface HospitalSearchClientProps {
  states: string[];
}

export function HospitalSearchClient({ states }: HospitalSearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get('q') ?? '');
  const [state, setState] = useState(searchParams.get('state') ?? '');

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (name.trim()) params.set('q', name.trim());
    if (state) params.set('state', state);
    router.push(`/dashboards/hospital-compass?${params.toString()}`);
  }, [name, state, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by hospital name..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        />
      </div>
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm min-w-[120px]"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <option value="">All states</option>
        {states.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button
        onClick={handleSearch}
        className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
      >
        Search
      </button>
    </div>
  );
}
