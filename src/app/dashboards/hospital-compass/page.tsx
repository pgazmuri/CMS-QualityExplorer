import type { Metadata } from 'next';
import { searchHospitals } from '@/lib/duckdb/queries/hospitals';
import { getDistinctStates } from '@/lib/duckdb/queries/hospitals';
import { HospitalSearchClient } from './HospitalSearchClient';
import { HospitalCard } from '@/components/dashboards/HospitalCard';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hospital Compass' };

const PAGE_SIZE = 24;

export default async function HospitalCompassPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const hasSearch = !!(params.q || params.state);
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  // Parse sort param (e.g., "star_rating:desc")
  const [sortCol, sortDir] = (params.sort ?? 'facility_name:asc').split(':');

  const { hospitals, totalCount } = hasSearch
    ? await searchHospitals({
        name: params.q,
        state: params.state,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        orderBy: sortCol,
        orderDir: sortDir === 'desc' ? 'desc' : 'asc',
      })
    : { hospitals: [], totalCount: 0 };
  const states = await getDistinctStates();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Hospital Compass
          <InfoTooltip measureId="star_rating" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Search any U.S. hospital and view its quality profile across all CMS domains.{' '}
          <a href="/about#star-ratings" className="text-blue-600 hover:underline">Learn more</a>
        </p>
      </div>

      <HospitalSearchClient
        states={states}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        sort={sortCol || 'facility_name'}
        sortDir={sortDir || 'asc'}
      />

      {/* Results */}
      {hasSearch && (
        <div className="mt-6">
          {hospitals.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No hospitals found. Try a different search.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hospitals.map((h) => (
                <HospitalCard key={h.facility_id} hospital={h} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Default state - show instructions */}
      {!hasSearch && (
        <div
          className="mt-8 rounded-xl border border-dashed p-12 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-medium mb-1">Search for a hospital to get started</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Enter a hospital name, city, or select a state
          </p>
        </div>
      )}
    </div>
  );
}
