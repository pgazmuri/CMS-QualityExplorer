import {
  tableToIPC,
  vectorFromArray,
  tableFromJSON,
  Table,
  Schema,
  Field,
  Utf8,
  Float64,
  Int32,
  Bool,
  DataType,
  Float32,
} from 'apache-arrow';
import { DuckDBTypeId } from '@duckdb/node-api';
import { ensureInitialized, withConnection } from './instance';

/** Map a DuckDB type ID to the Arrow DataType used for vectorFromArray. */
function duckdbTypeToArrow(typeId: DuckDBTypeId): DataType {
  switch (typeId) {
    case DuckDBTypeId.BOOLEAN:
      return new Bool();
    case DuckDBTypeId.TINYINT:
    case DuckDBTypeId.SMALLINT:
    case DuckDBTypeId.INTEGER:
    case DuckDBTypeId.UTINYINT:
    case DuckDBTypeId.USMALLINT:
    case DuckDBTypeId.UINTEGER:
      return new Int32();
    case DuckDBTypeId.FLOAT:
      return new Float32();
    case DuckDBTypeId.BIGINT:
    case DuckDBTypeId.UBIGINT:
    case DuckDBTypeId.DOUBLE:
    case DuckDBTypeId.DECIMAL:
    case DuckDBTypeId.HUGEINT:
    case DuckDBTypeId.UHUGEINT:
      return new Float64();
    default:
      // VARCHAR, DATE, TIMESTAMP, UUID, BLOB, etc. → string for safe transport
      return new Utf8();
  }
}

/**
 * Execute a SQL query and return the result as Arrow IPC stream bytes.
 * Skips getRowObjects() → BigInt map → JSON.stringify entirely.
 * Data flows: DuckDB columns → row objects → Arrow table → IPC bytes.
 */
export async function queryArrowIPC(sql: string): Promise<Uint8Array> {
  await ensureInitialized();
  return withConnection(async (conn) => {
    const result = await conn.runAndReadAll(sql);
    const colNames = result.columnNames();
    const colCount = result.columnCount;

    if (result.currentRowCount === 0) {
      // Build empty table with correct schema
      const typeIds: DuckDBTypeId[] = [];
      for (let i = 0; i < colCount; i++) {
        typeIds.push(result.columnTypeId(i));
      }
      const fields = colNames.map((name, i) =>
        new Field(name, duckdbTypeToArrow(typeIds[i]), true)
      );
      return tableToIPC(new Table(new Schema(fields)), 'stream');
    }

    // Use getRowObjectsJson() to get plain JS-safe row objects (no BigInt, no custom DuckDB types)
    const rows = result.getRowObjectsJson() as Record<string, unknown>[];

    // Coerce remaining BigInt values to Number (belt-and-suspenders)
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (typeof row[key] === 'bigint') {
          row[key] = Number(row[key]);
        }
      }
    }

    const table = tableFromJSON(rows);
    return tableToIPC(table, 'stream');
  });
}
