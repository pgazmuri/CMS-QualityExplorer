'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryViewer } from './QueryViewer';
import type { WidgetSpec, WidgetData } from '@/lib/agent/types';

interface MapWidgetProps {
  spec: WidgetSpec;
  data: WidgetData;
}

export function MapWidget({ spec, data }: MapWidgetProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.querySelector('link[href*="azure-maps-control"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
    document.head.appendChild(link);
  }, []);

  const initMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current || data.isLoading || data.rows.length === 0) return;

    const cfg = spec.mapConfig;
    if (!cfg) {
      setError('No map configuration provided');
      return;
    }

    try {
      const atlas = await import('azure-maps-control');
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
        center: [-98.5, 39.8],
        zoom: 3.5,
        style: 'road',
        language: 'en-US',
      });

      map.events.add('ready', () => {
        const datasource = new atlas.source.DataSource();
        map.sources.add(datasource);

        for (const row of data.rows) {
          const lat = Number(row[cfg.latKey]);
          const lon = Number(row[cfg.lonKey]);
          if (isNaN(lat) || isNaN(lon)) continue;

          datasource.add(new atlas.data.Feature(
            new atlas.data.Point([lon, lat]),
            { ...row }
          ));
        }

        // Color configuration
        let colorExpr: unknown = '#3b82f6';
        if (cfg.colorKey) {
          // Use star-rating-style color scale if the key looks like a rating (1-5)
          colorExpr = [
            'match',
            ['get', cfg.colorKey],
            5, '#22c55e',
            4, '#84cc16',
            3, '#eab308',
            2, '#f97316',
            1, '#ef4444',
            '#94a3b8',
          ];
        }

        // Size configuration
        let radiusExpr: unknown = 6;
        if (cfg.sizeKey) {
          radiusExpr = [
            'interpolate', ['linear'],
            ['get', cfg.sizeKey],
            0, 4,
            50, 10,
            200, 18,
            500, 26,
          ];
        }

        const bubbleLayer = new atlas.layer.BubbleLayer(datasource, undefined, {
          radius: radiusExpr as number,
          color: colorExpr as string,
          strokeColor: 'white',
          strokeWidth: 1,
          opacity: 0.85,
        });
        map.layers.add(bubbleLayer);

        // Popup
        const popup = new atlas.Popup({ closeButton: true, pixelOffset: [0, -10] });
        map.events.add('click', bubbleLayer, (e) => {
          if (e.shapes && e.shapes.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shape = e.shapes[0] as any;
            const props = shape.getProperties?.() ?? shape.properties;
            const coords = shape.getCoordinates?.() ?? shape.geometry?.coordinates;

            if (props && coords) {
              const label = props[cfg.labelKey] ?? '';
              const facilityLink = props.facility_id
                ? `<a href="/dashboards/hospital-compass/${props.facility_id}" style="color:#2563eb;text-decoration:none;font-weight:600;">${label}</a>`
                : `<strong>${label}</strong>`;

              // Show other properties as details
              const skip = new Set([cfg.latKey, cfg.lonKey, cfg.labelKey, 'facility_id']);
              const details = Object.entries(props)
                .filter(([k]) => !skip.has(k) && !k.startsWith('_'))
                .slice(0, 6)
                .map(([k, v]) => `<br/>${k}: <strong>${v}</strong>`)
                .join('');

              popup.setOptions({
                content: `<div style="padding:8px;max-width:240px;font-size:13px;background:#ffffff;color:#1e293b;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">${facilityLink}${details}</div>`,
                position: coords,
              });
              popup.open(map);
            }
          }
        });

        // Auto-fit bounds
        const positions = data.rows
          .map(r => [Number(r[cfg.lonKey]), Number(r[cfg.latKey])] as [number, number])
          .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat));
        if (positions.length > 0) {
          map.setCamera({
            bounds: atlas.data.BoundingBox.fromPositions(positions),
            padding: 40,
          });
        }

        setLoaded(true);
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize map widget:', err);
      setError('Failed to load map');
    }
  }, [spec.mapConfig, data]);

  useEffect(() => {
    if (!data.isLoading && data.rows.length > 0 && !mapInstanceRef.current) {
      initMap();
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap, data.isLoading, data.rows.length]);

  if (data.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.error) {
    return (
      <div className="rounded bg-destructive/10 p-3 text-sm text-destructive">
        Error: {data.error}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-dashed flex items-center justify-center text-sm text-muted-foreground" style={{ borderColor: 'var(--border)', minHeight: 300 }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="relative rounded-lg overflow-hidden" style={{ minHeight: 350, border: '1px solid var(--border)' }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 350 }} />
      </div>
      {spec.sql && <QueryViewer sql={spec.sql} />}
    </div>
  );
}
