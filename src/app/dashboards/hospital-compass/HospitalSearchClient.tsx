'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface HospitalSearchClientProps {
  states: string[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: string;
  sortDir: string;
}

const SORT_OPTIONS = [
  { value: 'facility_name:asc', label: 'Name (A–Z)' },
  { value: 'facility_name:desc', label: 'Name (Z–A)' },
  { value: 'star_rating:desc', label: 'Stars (High–Low)' },
  { value: 'star_rating:asc', label: 'Stars (Low–High)' },
  { value: 'state:asc', label: 'State (A–Z)' },
];

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 200];

type SearchMode = 'name' | 'distance';

export function HospitalSearchClient({ states, totalCount, page, pageSize, sort, sortDir }: HospitalSearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: SearchMode = searchParams.get('zip') ? 'distance' : 'name';

  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [name, setName] = useState(searchParams.get('q') ?? '');
  const [state, setState] = useState(searchParams.get('state') ?? '');
  const [zip, setZip] = useState(searchParams.get('zip') ?? '');
  const [radius, setRadius] = useState(searchParams.get('radius') ?? '25');

  const navigateName = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const q = overrides.q ?? name.trim();
    const st = overrides.state ?? state;
    if (q) params.set('q', q);
    if (st) params.set('state', st);
    if (overrides.sort) params.set('sort', overrides.sort);
    else if (sort !== 'facility_name' || sortDir !== 'asc') params.set('sort', `${sort}:${sortDir}`);
    if (overrides.page) params.set('page', overrides.page);
    else if (page > 1 && !overrides.resetPage) params.set('page', String(page));
    router.push(`/dashboards/hospital-compass?${params.toString()}`);
  }, [name, state, sort, sortDir, page, router]);

  const navigateDistance = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const z = overrides.zip ?? zip.trim();
    const r = overrides.radius ?? radius;
    if (z) params.set('zip', z);
    params.set('radius', r);
    if (overrides.page) params.set('page', overrides.page);
    else if (page > 1 && !overrides.resetPage) params.set('page', String(page));
    router.push(`/dashboards/hospital-compass?${params.toString()}`);
  }, [zip, radius, page, router]);

  const handleSearch = useCallback(() => {
    if (mode === 'distance') {
      navigateDistance({ resetPage: 'true' });
    } else {
      navigateName({ resetPage: 'true' });
    }
  }, [mode, navigateName, navigateDistance]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasSearch = !!(searchParams.get('q') || searchParams.get('state') || searchParams.get('zip'));

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted w-fit">
        <button
          onClick={() => setMode('name')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'name' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="h-3 w-3 inline mr-1" />
          Name / State
        </button>
        <button
          onClick={() => setMode('distance')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'distance' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="h-3 w-3 inline mr-1" />
          ZIP / Distance
        </button>
      </div>

      {/* Search controls */}
      {mode === 'name' ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by hospital name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm bg-card text-foreground"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm min-w-[120px]"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={`${sort}:${sortDir}`}
            onChange={(e) => navigateName({ sort: e.target.value, resetPage: 'true' })}
            className="px-3 py-2 rounded-lg border text-sm min-w-[140px]"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
              onKeyDown={handleKeyDown}
              placeholder="Enter ZIP code..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm bg-card text-foreground"
              style={{ borderColor: 'var(--border)' }}
              maxLength={5}
              inputMode="numeric"
            />
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm min-w-[140px]"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Search radius"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={String(r)}>Within {r} miles</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={zip.length < 5}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Find Nearby
          </button>
        </div>
      )}

      {/* Pagination controls */}
      {hasSearch && totalCount > 0 && (
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()} hospitals
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => mode === 'distance'
                  ? navigateDistance({ page: String(page - 1) })
                  : navigateName({ page: String(page - 1) })
                }
                disabled={page <= 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">Page {page} of {totalPages}</span>
              <button
                onClick={() => mode === 'distance'
                  ? navigateDistance({ page: String(page + 1) })
                  : navigateName({ page: String(page + 1) })
                }
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
