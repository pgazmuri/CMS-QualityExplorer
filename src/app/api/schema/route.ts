import { NextRequest, NextResponse } from 'next/server';
import { query, queryParameterized } from '@/lib/duckdb/instance';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tableName = searchParams.get('table');

    if (tableName) {
      // Validate table name: only allow alphanumeric + underscore to prevent injection
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
      }
      const rows = await queryParameterized(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $table_name
           AND table_schema = 'main'
         ORDER BY ordinal_position`,
        { table_name: tableName },
      );
      return NextResponse.json(rows);
    }

    // Full schema dump (no user input in query)
    const schema: Record<string, { column: string; type: string }[]> = {};
    const detailedRows = await query<{ table_name: string; column_name: string; data_type: string }>(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'main'
      ORDER BY table_name, ordinal_position
    `);

    for (const row of detailedRows) {
      const tbl = row.table_name;
      if (!schema[tbl]) schema[tbl] = [];
      schema[tbl].push({ column: row.column_name, type: row.data_type });
    }

    return NextResponse.json(schema);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Schema query failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
