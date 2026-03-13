import { query } from '../instance';

export interface HospitalSearchResult {
  facility_id: string;
  facility_name: string;
  city: string;
  state: string;
  zip: string;
  hospital_type: string | null;
  star_rating: number | null;
  emergency_services: string | null;
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

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
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

  if (params.name) {
    conditions.push(`facility_name ILIKE '%${escapeSql(params.name)}%'`);
  }
  if (params.state) {
    conditions.push(`state = '${escapeSql(params.state)}'`);
  }
  if (params.city) {
    conditions.push(`city ILIKE '%${escapeSql(params.city)}%'`);
  }
  if (params.zip) {
    conditions.push(`zip = '${escapeSql(params.zip)}'`);
  }
  if (params.hospital_type) {
    conditions.push(`hospital_type ILIKE '%${escapeSql(params.hospital_type)}%'`);
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
    query<HospitalSearchResult>(`
      SELECT facility_id, facility_name, city, state, zip,
             hospital_type, star_rating, emergency_services
      FROM v_hospital_profile
      ${WHERE}
      ${ORDER}
      LIMIT ${LIMIT} OFFSET ${OFFSET}
    `),
    query<{ cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM v_hospital_profile ${WHERE}
    `),
  ]);

  return { hospitals, totalCount: countResult[0]?.cnt ?? 0 };
}

export async function getHospitalById(facilityId: string): Promise<HospitalProfile | null> {
  const rows = await query<HospitalProfile>(`
    SELECT * FROM v_hospital_profile
    WHERE facility_id = '${escapeSql(facilityId)}'
    LIMIT 1
  `);
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
