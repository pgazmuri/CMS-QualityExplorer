import { NextRequest, NextResponse } from 'next/server';
import { lookupZip } from '@/lib/duckdb/queries/hospitals';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const zip = searchParams.get('zip') ?? undefined;
    const city = searchParams.get('city') ?? undefined;
    const state = searchParams.get('state') ?? undefined;

    if (!zip && !city && !state) {
      return NextResponse.json({ error: 'At least one of zip, city, or state is required' }, { status: 400 });
    }

    const results = await lookupZip({ zip, city, state });
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lookup failed';
    console.error('[/api/zip]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
