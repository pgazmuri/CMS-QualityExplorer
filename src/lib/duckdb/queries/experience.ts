import { query } from '../instance';

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

export interface HCAHPSStarRow {
  facility_id: string;
  facility_name: string;
  state: string;
  measure_id: string;
  question: string;
  star_rating: number | null;
  linear_mean: number | null;
  completed_surveys: number | null;
  response_rate: number | null;
}

export async function getHCAHPSStarsForHospital(facilityId: string): Promise<HCAHPSStarRow[]> {
  return query<HCAHPSStarRow>(`
    SELECT *
    FROM v_hcahps_stars
    WHERE facility_id = '${escapeSql(facilityId)}'
    ORDER BY measure_id
  `);
}

export async function getHCAHPSStateAverage(state: string): Promise<Array<{
  measure_id: string;
  question: string;
  avg_star_rating: number | null;
  avg_linear_mean: number | null;
}>> {
  return query(`
    SELECT measure_id, question,
           ROUND(AVG(star_rating), 2) AS avg_star_rating,
           ROUND(AVG(linear_mean), 2) AS avg_linear_mean
    FROM v_hcahps_stars
    WHERE state = '${escapeSql(state)}'
    GROUP BY measure_id, question
    ORDER BY measure_id
  `);
}

export async function getOverallHospitalStarDist(): Promise<Array<{
  star_rating: number;
  cnt: number;
}>> {
  return query(`
    SELECT star_rating, COUNT(*) AS cnt
    FROM v_hospital_profile
    WHERE star_rating IS NOT NULL
    GROUP BY star_rating
    ORDER BY star_rating
  `);
}
