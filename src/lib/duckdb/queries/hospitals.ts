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

export async function searchHospitals(params: {
  name?: string;
  state?: string;
  city?: string;
  zip?: string;
  hospital_type?: string;
  limit?: number;
}): Promise<HospitalSearchResult[]> {
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
  const LIMIT = Math.min(params.limit ?? 50, 200);

  return query<HospitalSearchResult>(`
    SELECT facility_id, facility_name, city, state, zip,
           hospital_type, star_rating, emergency_services
    FROM v_hospital_profile
    ${WHERE}
    ORDER BY facility_name
    LIMIT ${LIMIT}
  `);
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
