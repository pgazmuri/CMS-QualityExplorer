import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/duckdb/instance';
import { queryArrowIPC } from '@/lib/duckdb/arrow';

export const runtime = 'nodejs';

const ARROW_MIME = 'application/vnd.apache.arrow.stream';

/** Dangerous SQL keywords that should never appear in user-submitted queries. */
const DANGEROUS_KEYWORDS = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|ATTACH|COPY|EXPORT|IMPORT|LOAD|INSTALL|PRAGMA)\b/i;

function isSafeSQL(sql: string): boolean {
  // Strip SQL comments to prevent bypass via /* SELECT */ DROP ...
  const stripped = sql
    .replace(/--.*$/gm, '')        // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .trim();

  if (!stripped) return false;

  const normalized = stripped.toUpperCase().replace(/\s+/g, ' ');

  // Must start with SELECT or WITH
  if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
    return false;
  }

  // Reject multi-statement queries (semicolon followed by non-whitespace)
  if (/;\s*\S/.test(stripped)) return false;

  // Reject dangerous keywords
  if (DANGEROUS_KEYWORDS.test(stripped)) return false;

  return true;
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

    // Content negotiation: return Arrow IPC binary if client requests it
    const accept = req.headers.get('accept') ?? '';
    if (accept.includes(ARROW_MIME)) {
      const buffer = await queryArrowIPC(sql);
      return new Response(Buffer.from(buffer), {
        headers: { 'Content-Type': ARROW_MIME },
      });
    }

    // JSON fallback (default)
    const rows = await query(sql);
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
