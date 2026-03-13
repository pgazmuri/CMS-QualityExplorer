import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/duckdb/instance';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tableName = searchParams.get('table');

    const sql = tableName
      ? `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_name = '${tableName.replace(/'/g, "''")}'
           AND table_schema = 'main'
         ORDER BY ordinal_position`
      : `SELECT table_name, COUNT(*) AS column_count
         FROM information_schema.columns
         WHERE table_schema = 'main'
         GROUP BY table_name
         ORDER BY table_name`;

    const rows = await query(sql);

    if (tableName) {
      return NextResponse.json(rows);
    }

    // Group by table for full schema
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
