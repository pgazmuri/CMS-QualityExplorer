import type { Metadata } from 'next';
import { searchHospitals } from '@/lib/duckdb/queries/hospitals';
import { getDistinctStates } from '@/lib/duckdb/queries/hospitals';
import { HospitalSearchClient } from './HospitalSearchClient';
import { HospitalCard } from '@/components/dashboards/HospitalCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hospital Compass' };

export default async function HospitalCompassPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  const params = await searchParams;
  const hasSearch = !!(params.q || params.state);
  const hospitals = hasSearch
    ? await searchHospitals({ name: params.q, state: params.state, limit: 100 })
    : [];
  const states = await getDistinctStates();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Hospital Compass</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Search any U.S. hospital and view its quality profile across all CMS domains.
        </p>
      </div>

      <HospitalSearchClient states={states} />

      {/* Results */}
      {hasSearch && (
        <div className="mt-6">
          <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {hospitals.length === 0
              ? 'No hospitals found. Try a different search.'
              : `${hospitals.length} hospital${hospitals.length === 1 ? '' : 's'} found`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hospitals.map((h) => (
              <HospitalCard key={h.facility_id} hospital={h} />
            ))}
          </div>
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
