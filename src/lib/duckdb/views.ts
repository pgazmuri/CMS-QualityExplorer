import { DuckDBConnection } from '@duckdb/node-api';

export async function createViews(conn: DuckDBConnection): Promise<void> {
  // Haversine macro: returns distance in miles between two lat/lon pairs
  await conn.run(`
    CREATE OR REPLACE MACRO haversine_miles(lat1, lon1, lat2, lon2) AS
      3958.8 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(lat1 - lat2) / 2), 2) +
        COS(RADIANS(lat2)) * COS(RADIANS(lat1)) *
        POWER(SIN(RADIANS(lon1 - lon2) / 2), 2)
      ))
  `);

  // Zip centroids — from pre-generated pgeocode data
  await conn.run(`
    CREATE OR REPLACE TABLE v_zip_centroids AS
    SELECT zip, TRY_CAST(lat AS DOUBLE) AS lat, TRY_CAST(lon AS DOUBLE) AS lon
    FROM zip_geocode
    WHERE lat IS NOT NULL AND lon IS NOT NULL
  `);

  // Hospital profile — materialized table (the expensive geocoded join runs once)
  await conn.run(`
    CREATE OR REPLACE TABLE v_hospital_profile AS
    SELECT
      h."Facility ID"                                       AS facility_id,
      h."Facility Name"                                     AS facility_name,
      h."Address"                                           AS address,
      h."City/Town"                                         AS city,
      h."State"                                             AS state,
      h."ZIP Code"                                          AS zip,
      h."County/Parish"                                     AS county,
      h."Telephone Number"                                  AS phone,
      h."Hospital Type"                                     AS hospital_type,
      h."Hospital Ownership"                                AS ownership,
      h."Emergency Services"                                AS emergency_services,
      h."Meets criteria for birthing friendly designation"  AS birthing_friendly,
      TRY_CAST(h."Hospital overall rating" AS INTEGER)      AS star_rating,
      TRY_CAST(h."Count of Facility MORT Measures" AS INTEGER) AS mort_measure_count,
      TRY_CAST(h."Count of MORT Measures Better" AS INTEGER)   AS mort_better,
      TRY_CAST(h."Count of MORT Measures No Different" AS INTEGER) AS mort_same,
      TRY_CAST(h."Count of MORT Measures Worse" AS INTEGER)    AS mort_worse,
      TRY_CAST(h."Count of Facility Safety Measures" AS INTEGER) AS safety_measure_count,
      TRY_CAST(h."Count of Safety Measures Better" AS INTEGER)   AS safety_better,
      TRY_CAST(h."Count of Safety Measures No Different" AS INTEGER) AS safety_same,
      TRY_CAST(h."Count of Safety Measures Worse" AS INTEGER)    AS safety_worse,
      TRY_CAST(h."Count of Facility READM Measures" AS INTEGER)  AS readm_measure_count,
      TRY_CAST(h."Count of READM Measures Better" AS INTEGER)    AS readm_better,
      TRY_CAST(h."Count of READM Measures No Different" AS INTEGER) AS readm_same,
      TRY_CAST(h."Count of READM Measures Worse" AS INTEGER)     AS readm_worse,
      COALESCE(TRY_CAST(g.lat AS DOUBLE), zc.lat)           AS latitude,
      COALESCE(TRY_CAST(g.lon AS DOUBLE), zc.lon)           AS longitude
    FROM hospitals h
    LEFT JOIN geocoded_hospitals g
      ON UPPER(h."Facility Name") = UPPER(g.name)
      AND h."State" = g.state
    LEFT JOIN v_zip_centroids zc
      ON h."ZIP Code" = zc.zip
      AND g.lat IS NULL
  `);

  // HAI - SIR values only (HAI_1=CLABSI, HAI_2=CAUTI, HAI_3=SSI-Colon, HAI_4=SSI-Abd, HAI_5=MRSA, HAI_6=CDI)
  await conn.run(`
    CREATE OR REPLACE VIEW v_hai_sir AS
    SELECT
      "Facility ID"          AS facility_id,
      "Facility Name"        AS facility_name,
      "State"                AS state,
      "Measure ID"           AS measure_id,
      "Measure Name"         AS measure_name,
      "Compared to National" AS compared_to_national,
      TRY_CAST("Score" AS DOUBLE) AS sir_value,
      "Footnote"             AS footnote,
      TRY_CAST("Start Date" AS DATE) AS start_date,
      TRY_CAST("End Date"   AS DATE) AS end_date
    FROM hai
    WHERE "Measure ID" IN ('HAI_1_SIR','HAI_2_SIR','HAI_3_SIR','HAI_4_SIR','HAI_5_SIR','HAI_6_SIR',
                           'HAI_1','HAI_2','HAI_3','HAI_4','HAI_5','HAI_6')
      AND TRY_CAST("Score" AS DOUBLE) IS NOT NULL
  `);

  // Mortality and complications (MORT_* and COMP_*)
  await conn.run(`
    CREATE OR REPLACE VIEW v_mortality AS
    SELECT
      "Facility ID"          AS facility_id,
      "Facility Name"        AS facility_name,
      "State"                AS state,
      "Measure ID"           AS measure_id,
      "Measure Name"         AS measure_name,
      "Compared to National" AS compared_to_national,
      TRY_CAST("Score" AS DOUBLE)           AS score,
      TRY_CAST("Lower Estimate" AS DOUBLE)  AS lower_ci,
      TRY_CAST("Higher Estimate" AS DOUBLE) AS upper_ci,
      TRY_CAST("Denominator" AS INTEGER)    AS denominator,
      "Footnote"             AS footnote,
      TRY_CAST("Start Date" AS DATE) AS start_date,
      TRY_CAST("End Date"   AS DATE) AS end_date
    FROM complications_deaths
    WHERE "Measure ID" LIKE 'MORT_%' OR "Measure ID" LIKE 'COMP_%' OR "Measure ID" LIKE 'Hybrid_%'
  `);

  // HCAHPS star ratings (one row per hospital per domain measure)
  await conn.run(`
    CREATE OR REPLACE VIEW v_hcahps_stars AS
    SELECT
      "Facility ID"           AS facility_id,
      "Facility Name"         AS facility_name,
      "State"                 AS state,
      "HCAHPS Measure ID"     AS measure_id,
      "HCAHPS Question"       AS question,
      TRY_CAST("Patient Survey Star Rating" AS INTEGER)  AS star_rating,
      TRY_CAST("HCAHPS Answer Percent" AS DOUBLE)        AS answer_percent,
      TRY_CAST("HCAHPS Linear Mean Value" AS DOUBLE)     AS linear_mean,
      TRY_CAST("Number of Completed Surveys" AS INTEGER) AS completed_surveys,
      TRY_CAST("Survey Response Rate Percent" AS DOUBLE) AS response_rate,
      TRY_CAST("Start Date" AS DATE) AS start_date,
      TRY_CAST("End Date"   AS DATE) AS end_date
    FROM hcahps
    WHERE "HCAHPS Measure ID" LIKE '%_STAR_RATING'
  `);

  // MSPB (Medicare Spending Per Beneficiary ratio; 1.0 = national average)
  await conn.run(`
    CREATE OR REPLACE VIEW v_mspb AS
    SELECT
      "Facility ID"           AS facility_id,
      "Facility Name"         AS facility_name,
      "State"                 AS state,
      TRY_CAST("Score" AS DOUBLE) AS mspb_ratio,
      "Footnote"              AS footnote,
      TRY_CAST("Start Date" AS DATE) AS start_date,
      TRY_CAST("End Date"   AS DATE) AS end_date
    FROM mspb
    WHERE "Measure ID" = 'MSPB-1'
  `);

  // HVBP Total Performance Score with 4 domains
  await conn.run(`
    CREATE OR REPLACE VIEW v_hvbp_tps AS
    SELECT
      "Facility ID"   AS facility_id,
      "Facility Name" AS facility_name,
      "State"         AS state,
      TRY_CAST("Fiscal Year" AS INTEGER) AS fiscal_year,
      TRY_CAST("Total Performance Score" AS DOUBLE) AS tps,
      TRY_CAST("Weighted Normalized Clinical Outcomes Domain Score" AS DOUBLE) AS clinical_score,
      TRY_CAST("Weighted Person And Community Engagement Domain Score" AS DOUBLE) AS engagement_score,
      TRY_CAST("Weighted Safety Domain Score" AS DOUBLE) AS safety_score,
      TRY_CAST("Weighted Efficiency And Cost Reduction Domain Score" AS DOUBLE) AS efficiency_score
    FROM hvbp_tps
  `);

  // HAC Reduction Program
  await conn.run(`
    CREATE OR REPLACE VIEW v_hac AS
    SELECT
      "Facility ID"    AS facility_id,
      "Facility Name"  AS facility_name,
      "State"          AS state,
      TRY_CAST("Fiscal Year" AS INTEGER) AS fiscal_year,
      TRY_CAST("Total HAC Score" AS DOUBLE) AS hac_score,
      "Payment Reduction"  AS payment_reduction,
      TRY_CAST("PSI 90 Composite Value" AS DOUBLE) AS psi90,
      TRY_CAST("CLABSI SIR" AS DOUBLE)  AS clabsi_sir,
      TRY_CAST("CAUTI SIR" AS DOUBLE)   AS cauti_sir,
      TRY_CAST("SSI SIR" AS DOUBLE)     AS ssi_sir,
      TRY_CAST("CDI SIR" AS DOUBLE)     AS cdi_sir,
      TRY_CAST("MRSA SIR" AS DOUBLE)    AS mrsa_sir
    FROM hac_program
  `);

  // HRRP - Hospital Readmissions Reduction Program
  await conn.run(`
    CREATE OR REPLACE VIEW v_hrrp AS
    SELECT
      "Facility ID"    AS facility_id,
      "Facility Name"  AS facility_name,
      "State"          AS state,
      "Measure Name"   AS measure_name,
      TRY_CAST("Excess Readmission Ratio" AS DOUBLE)    AS excess_ratio,
      TRY_CAST("Predicted Readmission Rate" AS DOUBLE)  AS predicted_rate,
      TRY_CAST("Expected Readmission Rate" AS DOUBLE)   AS expected_rate,
      TRY_CAST("Number of Discharges" AS INTEGER)       AS discharges,
      "Footnote"       AS footnote,
      TRY_CAST("Start Date" AS DATE) AS start_date,
      TRY_CAST("End Date"   AS DATE) AS end_date
    FROM hrrp
  `);

  // State-level aggregate summary
  await conn.run(`
    CREATE OR REPLACE VIEW v_state_summary AS
    SELECT
      h.state,
      COUNT(DISTINCT h.facility_id)     AS hospital_count,
      ROUND(AVG(h.star_rating), 2)      AS avg_star_rating,
      ROUND(AVG(m.mspb_ratio), 3)       AS avg_mspb,
      COUNT(DISTINCT CASE WHEN hac.payment_reduction = 'Yes' THEN h.facility_id END) AS hac_penalized_count,
      ROUND(AVG(h.latitude), 4)         AS centroid_lat,
      ROUND(AVG(h.longitude), 4)        AS centroid_lon
    FROM v_hospital_profile h
    LEFT JOIN v_mspb m    ON h.facility_id = m.facility_id
    LEFT JOIN v_hac  hac  ON h.facility_id = hac.facility_id
    WHERE h.state IS NOT NULL
    GROUP BY h.state
    ORDER BY h.state
  `);

  console.log('[DuckDB] All views created successfully');
}
