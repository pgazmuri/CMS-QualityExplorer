import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/duckdb/instance';

export const runtime = 'nodejs';

function isSafeSQL(sql: string): boolean {
  const normalized = sql.trim().toUpperCase().replace(/\s+/g, ' ');
  return normalized.startsWith('SELECT') || normalized.startsWith('WITH');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql } = body as { sql: string };

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'Missing sql parameter' }, { status: 400 });
    }

    if (!isSafeSQL(sql)) {
      return NextResponse.json(
        { error: 'Only SELECT/WITH queries are allowed' },
        { status: 403 }
      );
    }

    const rows = await query(sql);
    // DuckDB returns COUNT(*) etc. as BigInt; serialize via replacer to convert to Number
    const responseJson = JSON.stringify({ rows, count: rows.length }, (_, v) =>
      typeof v === 'bigint' ? Number(v) : v
    );
    return new Response(responseJson, { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Query failed';
    console.error('[/api/query]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
