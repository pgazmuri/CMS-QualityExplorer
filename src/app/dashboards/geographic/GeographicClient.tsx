'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { SearchInput } from '@/components/dashboards/filters/SearchInput';
import { getMSPBColor, STAR_COLORS } from '@/lib/utils/color-scales';
import { Map, TableProperties } from 'lucide-react';

interface StateRow {
  state: string;
  hospital_count: number;
  avg_star_rating: number | null;
  avg_mspb: number | null;
  hac_penalized_count: number;
  star_rank: number;
  mspb_rank: number;
  centroid_lat: number | null;
  centroid_lon: number | null;
}

interface Props {
  stateData: StateRow[];
}

function StateMap({ stateData }: { stateData: StateRow[] }) {
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
    if (!mapRef.current || mapInstanceRef.current) return;

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

        for (const s of stateData) {
          if (s.centroid_lat == null || s.centroid_lon == null) continue;
          datasource.add(new atlas.data.Feature(
            new atlas.data.Point([s.centroid_lon, s.centroid_lat]),
            {
              state: s.state,
              hospital_count: s.hospital_count,
              avg_star_rating: s.avg_star_rating,
              avg_mspb: s.avg_mspb,
              hac_penalized_count: s.hac_penalized_count,
              star_rank: s.star_rank,
            }
          ));
        }

        // Bubble layer — size by hospital count, color by avg star rating
        const bubbleLayer = new atlas.layer.BubbleLayer(datasource, undefined, {
          radius: [
            'interpolate', ['linear'],
            ['get', 'hospital_count'],
            5, 8,
            50, 14,
            200, 22,
            500, 30,
          ],
          color: [
            'interpolate', ['linear'],
            ['get', 'avg_star_rating'],
            1, '#ef4444',
            2, '#f97316',
            3, '#eab308',
            4, '#84cc16',
            5, '#22c55e',
          ],
          strokeColor: 'white',
          strokeWidth: 1.5,
          opacity: 0.85,
        });

        // Symbol layer for state labels
        const symbolLayer = new atlas.layer.SymbolLayer(datasource, undefined, {
          textOptions: {
            textField: ['get', 'state'],
            size: 11,
            font: ['StandardFont-Bold'],
            color: '#1e293b',
            haloColor: '#ffffff',
            haloWidth: 1,
            offset: [0, 0],
          },
          iconOptions: { image: 'none' },
        });

        map.layers.add(bubbleLayer);
        map.layers.add(symbolLayer);

        // Popup
        const popup = new atlas.Popup({ closeButton: true, pixelOffset: [0, -15] });

        map.events.add('click', bubbleLayer, (e) => {
          if (e.shapes && e.shapes.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shape = e.shapes[0] as any;
            const props = shape.getProperties?.() ?? shape.properties;
            const coords = shape.getCoordinates?.() ?? shape.geometry?.coordinates;

            if (props && coords) {
              const stars = props.avg_star_rating != null
                ? `${'⭐'.repeat(Math.round(props.avg_star_rating))} ${props.avg_star_rating.toFixed(2)}`
                : 'N/A';
              const mspb = props.avg_mspb != null ? props.avg_mspb.toFixed(3) : 'N/A';
              const hacNote = props.hac_penalized_count > 0
                ? `<br/><span style="color:#f87171;">${props.hac_penalized_count} HAC penalized</span>`
                : '';

              popup.setOptions({
                content: `
                  <div style="padding:10px;max-width:240px;font-size:13px;background:#ffffff;color:#1e293b;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                    <strong style="font-size:15px;"><a href="/dashboards/geographic/${props.state}" style="color:#2563eb;text-decoration:none;">${props.state}</a></strong>
                    <span style="color:#64748b;margin-left:6px;">#${props.star_rank}</span>
                    <br/>Hospitals: <strong>${props.hospital_count}</strong>
                    <br/>Avg Stars: <strong>${stars}</strong>
                    <br/>Avg MSPB: <strong>${mspb}</strong>${hacNote}
                  </div>
                `,
                position: coords,
              });
              popup.open(map);
            }
          }
        });

        setLoaded(true);
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to load map');
    }
  }, [stateData]);

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
      <div className="rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground" style={{ borderColor: 'var(--border)', minHeight: 500 }}>
        {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ minHeight: 500, border: '1px solid var(--border)' }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.92)', color: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
        <div className="font-semibold mb-1">Avg Star Rating</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#ef4444' }} /> 1
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#f97316' }} /> 2
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#eab308' }} /> 3
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#84cc16' }} /> 4
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#22c55e' }} /> 5
        </div>
        <div className="mt-1 text-[10px] text-gray-500">Bubble size = hospital count</div>
      </div>
    </div>
  );
}

export function GeographicClient({ stateData }: Props) {
  const [view, setView] = useState<'map' | 'table'>('map');
  const [search, setSearch] = useState('');
  const hasFilters = search !== '';

  const filtered = useMemo(() => {
    if (!search) return stateData;
    return stateData.filter((r) => r.state.toLowerCase().includes(search.toLowerCase()));
  }, [stateData, search]);

  const columns: DataTableColumn<StateRow>[] = [
    {
      key: 'star_rank',
      header: 'Star Rank',
      sortable: true,
      align: 'center',
      render: (v) => <span className="font-bold" style={{ color: 'var(--muted-foreground)' }}>#{v as number}</span>,
    },
    { key: 'state', header: 'State', sortable: true, render: (v) => (
      <Link href={`/dashboards/geographic/${v as string}`} className="font-semibold text-blue-600 hover:underline">{v as string}</Link>
    ) },
    {
      key: 'hospital_count',
      header: 'Hospitals',
      sortable: true,
      align: 'right',
      render: (v) => (v as number).toLocaleString(),
    },
    {
      key: 'avg_star_rating',
      header: 'Avg Stars',
      sortable: true,
      tooltip: 'star_rating',
      render: (v) => {
        const val = v as number | null;
        const starColor = val != null
          ? STAR_COLORS[Math.min(5, Math.max(1, Math.round(val)))]
          : '#94a3b8';
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono" style={{ color: starColor }}>
              {val?.toFixed(2) ?? 'N/A'}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-16">
              <div
                className="h-1.5 rounded-full"
                style={{ width: `${((val ?? 0) / 5) * 100}%`, background: starColor }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'mspb_rank',
      header: 'MSPB Rank',
      sortable: true,
      align: 'center',
      render: (v) => <span style={{ color: 'var(--muted-foreground)' }}>#{v as number}</span>,
    },
    {
      key: 'avg_mspb',
      header: 'Avg MSPB',
      sortable: true,
      align: 'right',
      tooltip: 'mspb',
      render: (v) => (
        <span className={`font-mono font-semibold ${getMSPBColor(v as number | null)}`}>
          {(v as number)?.toFixed(3) ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'hac_penalized_count',
      header: 'HAC Penalized',
      sortable: true,
      align: 'right',
      tooltip: 'hac',
      render: (v) => {
        const count = v as number;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <span>{count}</span>
            {count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                penalized
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <FilterBar onReset={() => setSearch('')} showReset={hasFilters}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search state..." className="w-48" />
        </FilterBar>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted shrink-0">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'map' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-3 w-3 inline mr-1" />
            Map
          </button>
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TableProperties className="h-3 w-3 inline mr-1" />
            Table
          </button>
        </div>
      </div>

      {view === 'map' ? (
        <StateMap stateData={filtered} />
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={(row) => row.state}
            defaultSort={{ key: 'avg_star_rating', direction: 'desc' }}
            pageSize={0}
          />
        </div>
      )}
    </>
  );
}
