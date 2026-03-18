import { query, queryParameterized } from '../instance';

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
  return queryParameterized<HCAHPSStarRow>(`
    SELECT *
    FROM v_hcahps_stars
    WHERE facility_id = $facility_id
    ORDER BY measure_id
  `, { facility_id: facilityId });
}

export async function getHCAHPSStateAverage(state: string): Promise<Array<{
  measure_id: string;
  question: string;
  avg_star_rating: number | null;
  avg_linear_mean: number | null;
}>> {
  return queryParameterized(`
    SELECT measure_id, question,
           ROUND(AVG(star_rating), 2) AS avg_star_rating,
           ROUND(AVG(linear_mean), 2) AS avg_linear_mean
    FROM v_hcahps_stars
    WHERE state = $state
    GROUP BY measure_id, question
    ORDER BY measure_id
  `, { state });
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
