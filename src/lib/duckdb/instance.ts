import { DuckDBInstance, DuckDBConnection, DuckDBValue } from '@duckdb/node-api';

declare global {
  // eslint-disable-next-line no-var
  var __duckdb_instance: DuckDBInstance | undefined;
  var __duckdb_initialized: boolean | undefined;
  var __duckdb_init_promise: Promise<void> | undefined;
}

export async function getDuckDBInstance(): Promise<DuckDBInstance> {
  if (!globalThis.__duckdb_instance) {
    globalThis.__duckdb_instance = await DuckDBInstance.create(':memory:');
    globalThis.__duckdb_initialized = false;
  }
  return globalThis.__duckdb_instance;
}

export async function withConnection<T>(
  fn: (conn: DuckDBConnection) => Promise<T>
): Promise<T> {
  const instance = await getDuckDBInstance();
  const conn = await instance.connect();
  try {
    return await fn(conn);
  } finally {
    conn.closeSync();
  }
}

/** Ensure DuckDB is initialized with CMS data before querying.
 *  Uses a shared promise to prevent concurrent initialization races. */
export async function ensureInitialized(): Promise<void> {
  if (isInitialized()) return;
  if (!globalThis.__duckdb_init_promise) {
    globalThis.__duckdb_init_promise = (async () => {
      const { initializeDuckDB } = await import('./loader');
      await initializeDuckDB();
    })();
  }
  await globalThis.__duckdb_init_promise;
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  await ensureInitialized();
  return withConnection(async (conn) => {
    const result = await conn.runAndReadAll(sql);
    // Convert BigInt values (e.g. COUNT(*)) to Number for JSON serialization
    const rows = result.getRowObjects() as Record<string, unknown>[];
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
      )
    ) as T[];
  });
}

export async function queryParameterized<T = Record<string, unknown>>(
  sql: string,
  params: Record<string, DuckDBValue>,
): Promise<T[]> {
  await ensureInitialized();
  return withConnection(async (conn) => {
    const result = await conn.runAndReadAll(sql, params);
    const rows = result.getRowObjects() as Record<string, unknown>[];
    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
      )
    ) as T[];
  });
}

export async function execute(sql: string): Promise<void> {
  await withConnection(async (conn) => {
    await conn.run(sql);
  });
}

export function isInitialized(): boolean {
  return globalThis.__duckdb_initialized === true;
}

export function markInitialized(): void {
  globalThis.__duckdb_initialized = true;
}
