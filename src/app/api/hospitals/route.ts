import { NextRequest, NextResponse } from 'next/server';
import { searchHospitals, getHospitalById } from '@/lib/duckdb/queries/hospitals';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const facilityId = searchParams.get('id');

    // Single hospital lookup
    if (facilityId) {
      const hospital = await getHospitalById(facilityId);
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }
      return NextResponse.json(hospital);
    }

    // Search
    const hospitals = await searchHospitals({
      name:          searchParams.get('name') ?? undefined,
      state:         searchParams.get('state') ?? undefined,
      city:          searchParams.get('city') ?? undefined,
      zip:           searchParams.get('zip') ?? undefined,
      hospital_type: searchParams.get('type') ?? undefined,
      limit:         Number(searchParams.get('limit') ?? 50),
    });

    return NextResponse.json(hospitals);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    console.error('[/api/hospitals]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
