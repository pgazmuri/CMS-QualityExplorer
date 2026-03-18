import { query, queryParameterized } from '../instance';

export interface MortalityRow {
  facility_id: string;
  facility_name: string;
  state: string;
  measure_id: string;
  measure_name: string;
  compared_to_national: string | null;
  score: number | null;
  lower_ci: number | null;
  upper_ci: number | null;
  denominator: number | null;
  footnote: string | null;
}

export async function getMortalityForHospital(facilityId: string): Promise<MortalityRow[]> {
  return queryParameterized<MortalityRow>(`
    SELECT *
    FROM v_mortality
    WHERE facility_id = $facility_id
    ORDER BY measure_id
  `, { facility_id: facilityId });
}

export async function getMortalityByState(state: string, measureId: string): Promise<MortalityRow[]> {
  return queryParameterized<MortalityRow>(`
    SELECT *
    FROM v_mortality
    WHERE state = $state
      AND measure_id = $measure_id
      AND score IS NOT NULL
    ORDER BY score
  `, { state, measure_id: measureId });
}

export async function getMortalityNationalBenchmarks(): Promise<Array<{
  measure_id: string;
  measure_name: string;
  national_rate: number | null;
}>> {
  return query(`
    SELECT "Measure ID" AS measure_id, "Measure Name" AS measure_name,
           TRY_CAST("National Rate" AS DOUBLE) AS national_rate
    FROM complications_deaths_national
    WHERE "Measure ID" LIKE 'MORT_%'
    ORDER BY "Measure ID"
  `);
}

export async function getBenchmarkDistribution(measureId: string): Promise<Array<{
  compared_to_national: string;
  cnt: number;
}>> {
  return queryParameterized(`
    SELECT compared_to_national, COUNT(*) AS cnt
    FROM v_mortality
    WHERE measure_id = $measure_id
      AND compared_to_national IS NOT NULL
    GROUP BY compared_to_national
    ORDER BY cnt DESC
  `, { measure_id: measureId });
}
