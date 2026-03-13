import path from 'path';
import {
  getDuckDBInstance,
  withConnection,
  isInitialized,
  markInitialized,
} from './instance';

const DATA_DIR = process.env.CMS_DATA_DIR
  ? path.resolve(process.cwd(), process.env.CMS_DATA_DIR)
  : path.join(process.cwd(), 'CMS Data');

/** DuckDB on Windows requires forward slashes in file paths */
function toDuckDBPath(p: string): string {
  return p.replace(/\\/g, '/');
}

function csvPath(filename: string): string {
  return toDuckDBPath(path.join(DATA_DIR, filename));
}

/** Resolve a glob-style path (e.g. 'HCAHPS-Hospital_part*.csv') for DuckDB */
function csvGlob(pattern: string): string {
  return toDuckDBPath(path.join(DATA_DIR, pattern));
}

// Standard NULL sentinel values from CMS data files
// all_varchar=true prevents auto-type-detection failures on footnote columns
// (e.g. "5, 24" in HCAHPS). Views use TRY_CAST for all numeric fields.
const NULL_STRINGS = `nullstr = ['Not Available', ''], all_varchar = true`;

async function loadTable(
  conn: { run: (sql: string) => Promise<unknown> },
  tableName: string,
  filename: string
): Promise<void> {
  const fp = csvPath(filename);
  await (conn as { run: (sql: string) => Promise<unknown> }).run(`
    CREATE TABLE IF NOT EXISTS ${tableName} AS
    SELECT * FROM read_csv(
      '${fp}',
      header = true,
      ${NULL_STRINGS}
    )
  `);
  console.log(`[DuckDB] Loaded ${tableName} from ${filename}`);
}

/**
 * Load a table from multiple CSV part files using a glob pattern.
 * Each part file must have the same header row.
 */
async function loadTableFromParts(
  conn: { run: (sql: string) => Promise<unknown> },
  tableName: string,
  globPattern: string
): Promise<void> {
  const gp = csvGlob(globPattern);
  await conn.run(`
    CREATE TABLE IF NOT EXISTS ${tableName} AS
    SELECT * FROM read_csv(
      '${gp}',
      header = true,
      ${NULL_STRINGS}
    )
  `);
  console.log(`[DuckDB] Loaded ${tableName} from ${globPattern}`);
}

export async function initializeDuckDB(): Promise<void> {
  if (isInitialized()) {
    console.log('[DuckDB] Already initialized, skipping');
    return;
  }

  // Ensure the instance exists before starting
  await getDuckDBInstance();

  console.log('[DuckDB] Starting data load from:', DATA_DIR);
  const startTime = Date.now();

  await withConnection(async (conn) => {
    // ── Reference tables ──────────────────────────────────────────────────
    await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, 'hospitals', 'Hospital_General_Information.csv');
    await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, 'footnote_crosswalk', 'Footnote_Crosswalk.csv');
    await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, 'measure_dates', 'Measure_Dates.csv');

    // ── Core measure tables (tall/long format) ────────────────────────────
    const measureTables: Array<[string, string]> = [
      ['complications_deaths', 'Complications_and_Deaths-Hospital.csv'],
      ['hai',                  'Healthcare_Associated_Infections-Hospital.csv'],
      ['timely_care',          'Timely_and_Effective_Care-Hospital.csv'],
      ['unplanned_visits',     'Unplanned_Hospital_Visits-Hospital.csv'],
      ['imaging_efficiency',   'Outpatient_Imaging_Efficiency-Hospital.csv'],
      ['mspb',                 'Medicare_Hospital_Spending_Per_Patient-Hospital.csv'],
      ['spending_by_claim',    'Medicare_Hospital_Spending_by_Claim.csv'],
      ['health_equity',        'Health_Equity_Hospital.csv'],
      ['maternal_health',      'Maternal_Health-Hospital.csv'],
      ['psi',                  'CMS_PSI_6_decimal_file.csv'],
      ['patient_outcomes',     'PATIENT_REPORTED_OUTCOMES_FACILITY.csv'],
      ['promoting_interop',    'Promoting_Interoperability-Hospital.csv'],
    ];

    for (const [tableName, filename] of measureTables) {
      await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, tableName, filename);
    }

    // HCAHPS is split across multiple part files (original exceeds 100 MB)
    await loadTableFromParts(
      conn as unknown as { run: (sql: string) => Promise<unknown> },
      'hcahps',
      'HCAHPS-Hospital_part*.csv',
    );

    // ── HVBP (wide/pivot format) ──────────────────────────────────────────
    const hvbpTables: Array<[string, string]> = [
      ['hvbp_tps',        'hvbp_tps.csv'],
      ['hvbp_clinical',   'hvbp_clinical_outcomes.csv'],
      ['hvbp_safety',     'hvbp_safety.csv'],
      ['hvbp_engagement', 'hvbp_person_and_community_engagement.csv'],
      ['hvbp_efficiency', 'hvbp_efficiency_and_cost_reduction.csv'],
    ];

    for (const [tableName, filename] of hvbpTables) {
      await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, tableName, filename);
    }

    // ── Value-based program tables ────────────────────────────────────────
    await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, 'hac_program', 'FY_2025_HAC_Reduction_Program_Hospital.csv');
    await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, 'hrrp', 'FY_2025_Hospital_Readmissions_Reduction_Program_Hospital.csv');

    // ── State / National comparator tables ───────────────────────────────
    const comparatorTables: Array<[string, string]> = [
      ['complications_deaths_national', 'Complications_and_Deaths-National.csv'],
      ['complications_deaths_state',    'Complications_and_Deaths-State.csv'],
      ['hcahps_national',               'HCAHPS-National.csv'],
      ['hcahps_state',                  'HCAHPS-State.csv'],
      ['hai_national',                  'Healthcare_Associated_Infections-National.csv'],
      ['hai_state',                     'Healthcare_Associated_Infections-State.csv'],
      ['mspb_national',                 'Medicare_Hospital_Spending_Per_Patient-National.csv'],
      ['mspb_state',                    'Medicare_Hospital_Spending_Per_Patient-State.csv'],
      ['unplanned_national',            'Unplanned_Hospital_Visits-National.csv'],
      ['unplanned_state',               'Unplanned_Hospital_Visits-State.csv'],
      ['timely_national',               'Timely_and_Effective_Care-National.csv'],
      ['timely_state',                  'Timely_and_Effective_Care-State.csv'],
    ];

    for (const [tableName, filename] of comparatorTables) {
      await loadTable(conn as unknown as { run: (sql: string) => Promise<unknown> }, tableName, filename);
    }

    // ── Create analytical views ───────────────────────────────────────────
    const { createViews } = await import('./views');
    await createViews(conn);

    console.log(`[DuckDB] All tables loaded in ${Date.now() - startTime}ms`);
  });

  markInitialized();
}
