import { query, queryParameterized } from '../instance';
import type { DuckDBValue } from '@duckdb/node-api';

export interface HAISIRRow {
  facility_id: string;
  facility_name: string;
  state: string;
  measure_id: string;
  measure_name: string;
  compared_to_national: string | null;
  sir_value: number | null;
  footnote: string | null;
}

export interface HACRow {
  facility_id: string;
  facility_name: string;
  state: string;
  fiscal_year: number | null;
  hac_score: number | null;
  payment_reduction: string | null;
  psi90: number | null;
  clabsi_sir: number | null;
  cauti_sir: number | null;
  ssi_sir: number | null;
  cdi_sir: number | null;
  mrsa_sir: number | null;
}

export async function getHAISIRsForHospital(facilityId: string): Promise<HAISIRRow[]> {
  return queryParameterized<HAISIRRow>(`
    SELECT measure_id, measure_name, compared_to_national, sir_value, footnote
    FROM v_hai_sir
    WHERE facility_id = $facility_id
    ORDER BY measure_id
  `, { facility_id: facilityId });
}

export async function getHACForHospital(facilityId: string): Promise<HACRow | null> {
  const rows = await queryParameterized<HACRow>(`
    SELECT *
    FROM v_hac
    WHERE facility_id = $facility_id
    ORDER BY fiscal_year DESC
    LIMIT 1
  `, { facility_id: facilityId });
  return rows[0] ?? null;
}

export async function getStateHAIComparison(state: string, measureId: string): Promise<Array<{
  facility_id: string;
  facility_name: string;
  sir_value: number | null;
  compared_to_national: string | null;
}>> {
  return queryParameterized(`
    SELECT facility_id, facility_name, sir_value, compared_to_national
    FROM v_hai_sir
    WHERE state = $state
      AND measure_id = $measure_id
      AND sir_value IS NOT NULL
    ORDER BY sir_value
  `, { state, measure_id: measureId });
}

export async function getNationalHAIDistribution(measureId: string): Promise<Array<{
  bucket: number | null;
  cnt: number;
}>> {
  return queryParameterized(`
    SELECT ROUND(sir_value, 1) AS bucket, COUNT(*) AS cnt
    FROM v_hai_sir
    WHERE measure_id = $measure_id
      AND sir_value IS NOT NULL
    GROUP BY bucket
    ORDER BY bucket
  `, { measure_id: measureId });
}

export async function getHACLeaderboard(params: {
  state?: string;
  paymentReduction?: string;
  limit?: number;
}): Promise<HACRow[]> {
  const conditions: string[] = [];
  const bindings: Record<string, DuckDBValue> = {};
  if (params.state) {
    conditions.push(`state = $state`);
    bindings.state = params.state;
  }
  if (params.paymentReduction) {
    conditions.push(`payment_reduction = $payment_reduction`);
    bindings.payment_reduction = params.paymentReduction;
  }
  const WHERE = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return queryParameterized<HACRow>(`
    SELECT *
    FROM v_hac
    ${WHERE}
    ORDER BY hac_score NULLS LAST
    LIMIT ${params.limit ?? 100}
  `, bindings);
}
