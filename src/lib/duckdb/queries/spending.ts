import { query, queryParameterized } from '../instance';

export interface MSPBRow {
  facility_id: string;
  facility_name: string;
  state: string;
  mspb_ratio: number | null;
  footnote: string | null;
}

export async function getMSPBForHospital(facilityId: string): Promise<MSPBRow | null> {
  const rows = await queryParameterized<MSPBRow>(`
    SELECT *
    FROM v_mspb
    WHERE facility_id = $facility_id
    LIMIT 1
  `, { facility_id: facilityId });
  return rows[0] ?? null;
}

export async function getMSPBByState(state?: string): Promise<MSPBRow[]> {
  if (state) {
    return queryParameterized<MSPBRow>(`
      SELECT facility_id, facility_name, state, mspb_ratio, footnote
      FROM v_mspb
      WHERE state = $state
      ORDER BY mspb_ratio NULLS LAST
    `, { state });
  }
  return query<MSPBRow>(`
    SELECT facility_id, facility_name, state, mspb_ratio, footnote
    FROM v_mspb
    ORDER BY mspb_ratio NULLS LAST
  `);
}

export async function getSpendingByClaimForHospital(facilityId: string): Promise<Array<{
  period: string | null;
  claim_type: string | null;
  avg_spending_hospital: string | null;
  avg_spending_national: string | null;
  pct_spending_hospital: string | null;
  pct_spending_national: string | null;
}>> {
  return queryParameterized(`
    SELECT
      "Period"                     AS period,
      "Claim Type"                 AS claim_type,
      "Avg Spndg Per EP Hospital"  AS avg_spending_hospital,
      "Avg Spndg Per EP National"  AS avg_spending_national,
      "Percent of Spndg Hospital"  AS pct_spending_hospital,
      "Percent of Spndg National"  AS pct_spending_national
    FROM spending_by_claim
    WHERE "Facility ID" = $facility_id
    ORDER BY "Period", "Claim Type"
  `, { facility_id: facilityId });
}

export async function getMSPBDistribution(): Promise<Array<{
  bucket: number | null;
  cnt: number;
}>> {
  return query(`
    SELECT ROUND(mspb_ratio, 2) AS bucket, COUNT(*) AS cnt
    FROM v_mspb
    WHERE mspb_ratio IS NOT NULL
    GROUP BY bucket
    ORDER BY bucket
  `);
}
