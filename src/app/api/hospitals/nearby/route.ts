import { NextRequest, NextResponse } from 'next/server';
import { searchHospitalsByDistance } from '@/lib/duckdb/queries/hospitals';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lon = parseFloat(searchParams.get('lon') ?? '');
    const radius = parseFloat(searchParams.get('radius') ?? '25');
    const limit = parseInt(searchParams.get('limit') ?? '24', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }
    if (radius <= 0 || radius > 500) {
      return NextResponse.json({ error: 'Radius must be between 1 and 500 miles' }, { status: 400 });
    }

    const result = await searchHospitalsByDistance({ lat, lon, radiusMiles: radius, limit, offset });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    console.error('[/api/hospitals/nearby]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
