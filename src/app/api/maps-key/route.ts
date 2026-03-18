import { NextResponse } from 'next/server';
import { DefaultAzureCredential } from '@azure/identity';

export const runtime = 'nodejs';

const ATLAS_SCOPE = 'https://atlas.microsoft.com/.default';
let credential: DefaultAzureCredential | null = null;

export async function GET() {
  const clientId = process.env.AZURE_MAPS_CLIENT_ID;

  // Fallback: if no client ID configured, return subscription key (dev mode only)
  if (!clientId) {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Azure Maps not configured (token auth required in production)' }, { status: 503 });
    }
    const key = process.env.AZURE_MAPS_KEY;
    if (!key) return NextResponse.json({ error: 'Azure Maps not configured' }, { status: 503 });
    return NextResponse.json({ mode: 'key', key });
  }

  try {
    if (!credential) credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken(ATLAS_SCOPE);
    return NextResponse.json({
      mode: 'token',
      token: tokenResponse.token,
      clientId,
      expiresOn: tokenResponse.expiresOnTimestamp,
    }, {
      headers: { 'Cache-Control': 'private, max-age=3300' },
    });
  } catch (err) {
    console.error('[/api/maps-key] Token error:', err instanceof Error ? err.message : err);
    // Fallback to subscription key only in development
    if (process.env.NODE_ENV === 'development') {
      const key = process.env.AZURE_MAPS_KEY;
      if (key) return NextResponse.json({ mode: 'key', key });
    }
    return NextResponse.json({ error: 'Azure Maps auth failed' }, { status: 503 });
  }
}
