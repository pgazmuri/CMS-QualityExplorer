import { query } from '../instance';

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

export interface HVBPTPSRow {
  facility_id: string;
  facility_name: string;
  state: string;
  fiscal_year: number | null;
  tps: number | null;
  clinical_score: number | null;
  engagement_score: number | null;
  safety_score: number | null;
  efficiency_score: number | null;
}

export interface HRRPRow {
  facility_id: string;
  facility_name: string;
  state: string;
  measure_name: string;
  excess_ratio: number | null;
  predicted_rate: number | null;
  expected_rate: number | null;
  discharges: number | null;
}

export async function getHVBPTPSForHospital(facilityId: string): Promise<HVBPTPSRow | null> {
  const rows = await query<HVBPTPSRow>(`
    SELECT *
    FROM v_hvbp_tps
    WHERE facility_id = '${escapeSql(facilityId)}'
    ORDER BY fiscal_year DESC
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function getHVBPLeaderboard(params: {
  state?: string;
  limit?: number;
}): Promise<HVBPTPSRow[]> {
  const WHERE = params.state ? `WHERE state = '${escapeSql(params.state)}'` : '';
  return query<HVBPTPSRow>(`
    SELECT *
    FROM v_hvbp_tps
    ${WHERE}
    ORDER BY tps DESC NULLS LAST
    LIMIT ${params.limit ?? 100}
  `);
}

export async function getHRRPForHospital(facilityId: string): Promise<HRRPRow[]> {
  return query<HRRPRow>(`
    SELECT *
    FROM v_hrrp
    WHERE facility_id = '${escapeSql(facilityId)}'
    ORDER BY measure_name
  `);
}

export async function getStateSummary(): Promise<Array<{
  state: string;
  hospital_count: number;
  avg_star_rating: number | null;
  avg_mspb: number | null;
  hac_penalized_count: number;
}>> {
  return query(`
    SELECT state, hospital_count, avg_star_rating, avg_mspb, hac_penalized_count
    FROM v_state_summary
    ORDER BY state
  `);
}

export async function getProgramSummaryForHospital(facilityId: string): Promise<{
  hvbp: HVBPTPSRow | null;
  hrrp: HRRPRow[];
}> {
  const [hvbp, hrrp] = await Promise.all([
    getHVBPTPSForHospital(facilityId),
    getHRRPForHospital(facilityId),
  ]);
  return { hvbp, hrrp };
}
