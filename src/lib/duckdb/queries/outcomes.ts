import { query } from '../instance';

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

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
  return query<MortalityRow>(`
    SELECT *
    FROM v_mortality
    WHERE facility_id = '${escapeSql(facilityId)}'
    ORDER BY measure_id
  `);
}

export async function getMortalityByState(state: string, measureId: string): Promise<MortalityRow[]> {
  return query<MortalityRow>(`
    SELECT *
    FROM v_mortality
    WHERE state = '${escapeSql(state)}'
      AND measure_id = '${escapeSql(measureId)}'
      AND score IS NOT NULL
    ORDER BY score
  `);
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
  return query(`
    SELECT compared_to_national, COUNT(*) AS cnt
    FROM v_mortality
    WHERE measure_id = '${escapeSql(measureId)}'
      AND compared_to_national IS NOT NULL
    GROUP BY compared_to_national
    ORDER BY cnt DESC
  `);
}
