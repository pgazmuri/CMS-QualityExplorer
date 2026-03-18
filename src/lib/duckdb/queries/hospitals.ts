import { query, queryParameterized } from '../instance';
import type { DuckDBValue } from '@duckdb/node-api';

export interface HospitalSearchResult {
  facility_id: string;
  facility_name: string;
  city: string;
  state: string;
  zip: string;
  hospital_type: string | null;
  star_rating: number | null;
  emergency_services: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_miles?: number;
}

export interface HospitalProfile extends HospitalSearchResult {
  address: string | null;
  county: string | null;
  phone: string | null;
  ownership: string | null;
  birthing_friendly: string | null;
  mort_better: number | null;
  mort_same: number | null;
  mort_worse: number | null;
  safety_better: number | null;
  safety_same: number | null;
  safety_worse: number | null;
  readm_better: number | null;
  readm_same: number | null;
  readm_worse: number | null;
}

const VALID_SORT_COLUMNS = ['facility_name', 'state', 'star_rating', 'city'] as const;
type SortColumn = typeof VALID_SORT_COLUMNS[number];

export interface SearchHospitalsResult {
  hospitals: HospitalSearchResult[];
  totalCount: number;
}

export async function searchHospitals(params: {
  name?: string;
  state?: string;
  city?: string;
  zip?: string;
  hospital_type?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}): Promise<SearchHospitalsResult> {
  const conditions: string[] = [];
  const bindings: Record<string, DuckDBValue> = {};

  if (params.name) {
    conditions.push(`facility_name ILIKE '%' || $name || '%'`);
    bindings.name = params.name;
  }
  if (params.state) {
    conditions.push(`state = $state`);
    bindings.state = params.state;
  }
  if (params.city) {
    conditions.push(`city ILIKE '%' || $city || '%'`);
    bindings.city = params.city;
  }
  if (params.zip) {
    conditions.push(`zip = $zip`);
    bindings.zip = params.zip;
  }
  if (params.hospital_type) {
    conditions.push(`hospital_type ILIKE '%' || $hospital_type || '%'`);
    bindings.hospital_type = params.hospital_type;
  }

  const WHERE = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const LIMIT = Math.min(params.limit ?? 24, 200);
  const OFFSET = Math.max(params.offset ?? 0, 0);

  // Validate sort column to prevent SQL injection
  const sortCol: SortColumn = VALID_SORT_COLUMNS.includes(params.orderBy as SortColumn)
    ? (params.orderBy as SortColumn)
    : 'facility_name';
  const sortDir = params.orderDir === 'desc' ? 'DESC' : 'ASC';
  // Put NULLs last when sorting
  const ORDER = `ORDER BY ${sortCol} ${sortDir} NULLS LAST`;

  const [hospitals, countResult] = await Promise.all([
    queryParameterized<HospitalSearchResult>(`
      SELECT facility_id, facility_name, city, state, zip,
             hospital_type, star_rating, emergency_services,
             latitude, longitude
      FROM v_hospital_profile
      ${WHERE}
      ${ORDER}
      LIMIT ${LIMIT} OFFSET ${OFFSET}
    `, bindings),
    queryParameterized<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM v_hospital_profile ${WHERE}
    `, bindings),
  ]);

  return { hospitals, totalCount: countResult[0]?.cnt ?? 0 };
}

/**
 * Search hospitals within a given radius (miles) of a lat/lon coordinate.
 * Uses the Haversine formula in SQL.
 */
export async function searchHospitalsByDistance(params: {
  lat: number;
  lon: number;
  radiusMiles: number;
  limit?: number;
  offset?: number;
}): Promise<SearchHospitalsResult> {
  // Validate numeric inputs to prevent injection via crafted numbers
  const lat = Number(params.lat);
  const lon = Number(params.lon);
  const radiusMiles = Number(params.radiusMiles);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radiusMiles)) {
    throw new Error('Invalid numeric parameters for distance search');
  }
  const LIMIT = Math.min(params.limit ?? 24, 200);
  const OFFSET = Math.max(params.offset ?? 0, 0);

  // Haversine formula in DuckDB SQL (result in miles)
  const HAVERSINE = `
    3958.8 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(latitude - ${lat}) / 2), 2) +
      COS(RADIANS(${lat})) * COS(RADIANS(latitude)) *
      POWER(SIN(RADIANS(longitude - ${lon}) / 2), 2)
    ))
  `;

  const WHERE = `WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND (${HAVERSINE}) <= ${radiusMiles}`;

  const [hospitals, countResult] = await Promise.all([
    query<HospitalSearchResult>(`
      SELECT facility_id, facility_name, city, state, zip,
             hospital_type, star_rating, emergency_services,
             latitude, longitude,
             ROUND(${HAVERSINE}, 1) AS distance_miles
      FROM v_hospital_profile
      ${WHERE}
      ORDER BY distance_miles ASC
      LIMIT ${LIMIT} OFFSET ${OFFSET}
    `),
    query<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM v_hospital_profile ${WHERE}
    `),
  ]);

  return { hospitals, totalCount: countResult[0]?.cnt ?? 0 };
}

/**
 * Look up zip codes by city/state or find cities by zip.
 */
export interface CityMatch {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  hospital_count: number;
}

export interface ZipLookupResponse {
  matches: CityMatch[];
}

/** Expand common US city abbreviations into ILIKE variants.
 *  "St. Louis" → also "Saint Louis"; "Fort Worth" → also "Ft Worth", etc. */
function cityVariants(city: string): string[] {
  const variants = [city];
  if (/\bst\.?\s/i.test(city + ' ')) {
    variants.push(city.replace(/\bst\.?\b/gi, 'Saint'));
  }
  if (/\bsaint\b/i.test(city)) {
    variants.push(city.replace(/\bsaint\b/gi, 'St'));
    variants.push(city.replace(/\bsaint\b/gi, 'St.'));
  }
  if (/\bmt\.?\s/i.test(city + ' ')) {
    variants.push(city.replace(/\bmt\.?\b/gi, 'Mount'));
  }
  if (/\bmount\b/i.test(city)) {
    variants.push(city.replace(/\bmount\b/gi, 'Mt'));
  }
  if (/\bft\.?\s/i.test(city + ' ')) {
    variants.push(city.replace(/\bft\.?\b/gi, 'Fort'));
  }
  if (/\bfort\b/i.test(city)) {
    variants.push(city.replace(/\bfort\b/gi, 'Ft'));
  }
  return [...new Set(variants)];
}

export async function lookupZip(params: {
  zip?: string;
  city?: string;
  state?: string;
}): Promise<ZipLookupResponse> {
  const conditions: string[] = [];
  const bindings: Record<string, DuckDBValue> = {};

  if (params.zip) {
    conditions.push(`zip = $zip`);
    bindings.zip = params.zip;
  }
  if (params.city) {
    const variants = cityVariants(params.city);
    // Use parameterized OR conditions for each city variant
    const likes = variants.map((_, i) => `city ILIKE '%' || $city_v${i} || '%'`);
    variants.forEach((v, i) => { bindings[`city_v${i}`] = v; });
    conditions.push(`(${likes.join(' OR ')})`);
  }
  if (params.state) {
    conditions.push(`state = $state`);
    bindings.state = params.state;
  }
  if (conditions.length === 0) return { matches: [] };

  const WHERE = `WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND ${conditions.join(' AND ')}`;
  const matches = await queryParameterized<CityMatch>(`
    SELECT city, state,
           ROUND(AVG(latitude), 4) AS latitude,
           ROUND(AVG(longitude), 4) AS longitude,
           COUNT(*) AS hospital_count
    FROM v_hospital_profile
    ${WHERE}
    GROUP BY city, state
    ORDER BY hospital_count DESC
    LIMIT 20
  `, bindings);

  return { matches };
}

export async function getHospitalById(facilityId: string): Promise<HospitalProfile | null> {
  const rows = await queryParameterized<HospitalProfile>(`
    SELECT * FROM v_hospital_profile
    WHERE facility_id = $facility_id
    LIMIT 1
  `, { facility_id: facilityId });
  return rows[0] ?? null;
}

export async function getDistinctStates(): Promise<string[]> {
  const rows = await query<{ state: string }>(`
    SELECT DISTINCT state
    FROM v_hospital_profile
    WHERE state IS NOT NULL
    ORDER BY state
  `);
  return rows.map((r) => r.state);
}
