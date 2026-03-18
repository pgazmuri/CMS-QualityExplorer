import type { Metadata } from 'next';
import { searchHospitals, searchHospitalsByDistance, lookupZip } from '@/lib/duckdb/queries/hospitals';
import { getDistinctStates } from '@/lib/duckdb/queries/hospitals';
import { HospitalSearchClient } from './HospitalSearchClient';
import { HospitalCard } from '@/components/dashboards/HospitalCard';
import { HospitalMap } from '@/components/dashboards/HospitalMap';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hospital Compass' };

const PAGE_SIZE = 24;

export default async function HospitalCompassPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string; page?: string; sort?: string; zip?: string; radius?: string; lat?: string; lon?: string }>;
}) {
  const params = await searchParams;
  const hasNameSearch = !!(params.q || params.state);
  const hasDistanceSearch = !!(params.zip || (params.lat && params.lon));
  const hasSearch = hasNameSearch || hasDistanceSearch;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  // Parse sort param (e.g., "star_rating:desc")
  const [sortCol, sortDir] = (params.sort ?? 'facility_name:asc').split(':');
  const radius = parseFloat(params.radius ?? '25');

  let hospitals: Awaited<ReturnType<typeof searchHospitals>>['hospitals'] = [];
  let totalCount = 0;
  let mapCenter: { lat: number; lon: number } | undefined;

  if (hasDistanceSearch) {
    // Distance-based search: resolve coordinates
    let lat = parseFloat(params.lat ?? '');
    let lon = parseFloat(params.lon ?? '');

    if (isNaN(lat) || isNaN(lon)) {
      // Try local zip lookup first
      if (params.zip) {
        const { matches } = await lookupZip({ zip: params.zip });
        if (matches.length > 0) {
          lat = matches[0].latitude;
          lon = matches[0].longitude;
        }
      }
      // Fall back to Azure Maps geocoding
      if ((isNaN(lat) || isNaN(lon)) && params.zip && process.env.AZURE_MAPS_KEY) {
        try {
          const url = new URL('https://atlas.microsoft.com/search/address/json');
          url.searchParams.set('api-version', '1.0');
          url.searchParams.set('subscription-key', process.env.AZURE_MAPS_KEY);
          url.searchParams.set('query', params.zip);
          url.searchParams.set('countrySet', 'US');
          url.searchParams.set('limit', '1');
          const geoRes = await fetch(url.toString());
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const pos = geoData.results?.[0]?.position;
            if (pos) { lat = pos.lat; lon = pos.lon; }
          }
        } catch { /* geocoding failed, proceed without coordinates */ }
      }
    }

    if (!isNaN(lat) && !isNaN(lon)) {
      mapCenter = { lat, lon };
      const result = await searchHospitalsByDistance({
        lat,
        lon,
        radiusMiles: radius,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      hospitals = result.hospitals;
      totalCount = result.totalCount;
    }
  } else if (hasNameSearch) {
    const result = await searchHospitals({
      name: params.q,
      state: params.state,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      orderBy: sortCol,
      orderDir: sortDir === 'desc' ? 'desc' : 'asc',
    });
    hospitals = result.hospitals;
    totalCount = result.totalCount;
  }

  const states = await getDistinctStates();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Hospital Compass
          <InfoTooltip measureId="star_rating" />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Search any U.S. hospital by name, state, ZIP code, or find nearby hospitals by distance.{' '}
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
              No hospitals found. Try a different search or increase the radius.
            </p>
          ) : (
            <>
              {/* Map view */}
              <HospitalMap
                hospitals={hospitals}
                center={mapCenter}
                radiusMiles={hasDistanceSearch ? radius : undefined}
                className="mb-6"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {hospitals.map((h) => (
                  <HospitalCard key={h.facility_id} hospital={h} />
                ))}
              </div>
            </>
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
            Enter a hospital name, city, or select a state — or search by ZIP code to find nearby hospitals
          </p>
        </div>
      )}
    </div>
  );
}
