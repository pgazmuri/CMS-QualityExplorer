'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { HospitalSearchResult } from '@/lib/duckdb/queries/hospitals';

interface HospitalMapProps {
  hospitals: HospitalSearchResult[];
  center?: { lat: number; lon: number };
  radiusMiles?: number;
  className?: string;
}

export function HospitalMap({ hospitals, center, radiusMiles, className }: HospitalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamically load Azure Maps CSS
  useEffect(() => {
    if (document.querySelector('link[href*="azure-maps-control"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
    document.head.appendChild(link);
  }, []);

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const atlas = await import('azure-maps-control');

      // Fetch auth config from server (token-based or key fallback)
      const authRes = await fetch('/api/maps-key');
      if (!authRes.ok) { setError('Azure Maps not configured'); return; }
      const authData = await authRes.json();

      const authOptions = authData.mode === 'token'
        ? {
            authType: atlas.AuthenticationType.anonymous,
            clientId: authData.clientId as string,
            getToken: async (resolve: (v?: string) => void, reject: (e?: unknown) => void) => {
              try {
                const r = await fetch('/api/maps-key');
                const d = await r.json();
                resolve(d.token);
              } catch (e) { reject(e); }
            },
          }
        : {
            authType: atlas.AuthenticationType.subscriptionKey,
            subscriptionKey: authData.key as string,
          };

      const map = new atlas.Map(mapRef.current!, {
        authOptions,
        center: center ? [center.lon, center.lat] : [-98.5, 39.8], // US center
        zoom: center ? 9 : 4,
        style: 'road',
        language: 'en-US',
      });

      map.events.add('ready', () => {
        const datasource = new atlas.source.DataSource();
        map.sources.add(datasource);

        // Add hospital markers
        for (const h of hospitals) {
          if (h.latitude == null || h.longitude == null) continue;
          const point = new atlas.data.Feature(
            new atlas.data.Point([h.longitude, h.latitude]),
            {
              facility_id: h.facility_id,
              facility_name: h.facility_name,
              city: h.city,
              state: h.state,
              star_rating: h.star_rating,
              distance_miles: h.distance_miles,
            }
          );
          datasource.add(point);
        }

        // Bubble layer for hospitals
        const bubbleLayer = new atlas.layer.BubbleLayer(datasource, undefined, {
          radius: 6,
          color: [
            'match',
            ['get', 'star_rating'],
            5, '#22c55e',
            4, '#84cc16',
            3, '#eab308',
            2, '#f97316',
            1, '#ef4444',
            '#94a3b8', // default (no rating)
          ],
          strokeColor: 'white',
          strokeWidth: 1,
          opacity: 0.85,
        });

        map.layers.add(bubbleLayer);

        // Popup on click
        const popup = new atlas.Popup({ closeButton: true, pixelOffset: [0, -10] });

        map.events.add('click', bubbleLayer, (e) => {
          if (e.shapes && e.shapes.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shape = e.shapes[0] as any;
            const props = shape.getProperties?.() ?? shape.properties;
            const coords = shape.getCoordinates?.() ?? (shape.geometry?.coordinates);

            if (props && coords) {
              const stars = props.star_rating ? '⭐'.repeat(props.star_rating) : 'Not rated';
              const dist = props.distance_miles != null ? `<br/><strong>${props.distance_miles} mi away</strong>` : '';
              popup.setOptions({
                content: `
                  <div style="padding:8px;max-width:220px;font-size:13px;background:#ffffff;color:#1e293b;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                    <strong><a href="/dashboards/hospital-compass/${props.facility_id}" style="color:#2563eb;text-decoration:none;">${props.facility_name}</a></strong>
                    <br/>${props.city}, ${props.state}
                    <br/>${stars}${dist}
                  </div>
                `,
                position: coords,
              });
              popup.open(map);
            }
          }
        });

        // Add radius circle if center is specified
        if (center && radiusMiles) {
          const circle = new atlas.data.Feature(
            new atlas.data.Point([center.lon, center.lat]),
            { subType: 'Circle', radius: radiusMiles * 1609.34 } // miles to meters
          );
          const circleSource = new atlas.source.DataSource();
          circleSource.add(circle);
          map.sources.add(circleSource);
          map.layers.add(new atlas.layer.PolygonLayer(circleSource, undefined, {
            fillColor: 'rgba(59, 130, 246, 0.08)',
            strokeColor: 'rgba(59, 130, 246, 0.3)',
            strokeWidth: 1,
          }));
        }

        // Auto-fit bounds if there are hospitals
        if (hospitals.length > 0) {
          const validHospitals = hospitals.filter(h => h.latitude != null && h.longitude != null);
          if (validHospitals.length > 0) {
            const positions = validHospitals.map(h => [h.longitude!, h.latitude!] as [number, number]);
            map.setCamera({
              bounds: atlas.data.BoundingBox.fromPositions(positions),
              padding: 50,
            });
          }
        }

        setLoaded(true);
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize Azure Maps:', err);
      setError('Failed to load map');
    }
  }, [hospitals, center, radiusMiles]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  if (error) {
    return (
      <div className={`rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground ${className ?? ''}`} style={{ borderColor: 'var(--border)', minHeight: 300 }}>
        {error}
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className ?? ''}`} style={{ minHeight: 400, border: '1px solid var(--border)' }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
    </div>
  );
}
