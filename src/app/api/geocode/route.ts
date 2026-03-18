import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface GeocodeResult {
  lat: number;
  lon: number;
  formattedAddress: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q');
    const zip = searchParams.get('zip');

    if (!query && !zip) {
      return NextResponse.json({ error: 'q or zip parameter required' }, { status: 400 });
    }

    const mapsKey = process.env.AZURE_MAPS_KEY;
    if (!mapsKey) {
      return NextResponse.json({ error: 'Azure Maps not configured' }, { status: 503 });
    }

    const searchText = zip || query;
    const url = new URL('https://atlas.microsoft.com/search/address/json');
    url.searchParams.set('api-version', '1.0');
    url.searchParams.set('subscription-key', mapsKey);
    url.searchParams.set('query', searchText!);
    url.searchParams.set('countrySet', 'US');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return NextResponse.json({ error: `Azure Maps error: ${res.status}`, detail: body }, { status: 502 });
    }

    const data = await res.json();
    const results: GeocodeResult[] = (data.results ?? []).map((r: Record<string, unknown>) => {
      const addr = r.address as Record<string, string>;
      const pos = r.position as Record<string, number>;
      return {
        lat: pos.lat,
        lon: pos.lon,
        formattedAddress: addr.freeformAddress ?? '',
        city: addr.municipality,
        state: addr.countrySubdivision,
        zip: addr.postalCode,
      };
    });

    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Geocode failed';
    console.error('[/api/geocode]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
