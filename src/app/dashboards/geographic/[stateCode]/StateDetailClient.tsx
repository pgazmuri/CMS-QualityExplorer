'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/dashboards/DataTable';
import { FilterBar } from '@/components/dashboards/filters/FilterBar';
import { SearchInput } from '@/components/dashboards/filters/SearchInput';
import { STAR_COLORS, getMSPBColor } from '@/lib/utils/color-scales';
import type { StateHospital, StateSummary } from './types';

interface Props {
  stateCode: string;
  stateName: string;
  hospitals: StateHospital[];
  summary: StateSummary;
}

const SELECT_CLS = 'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

/* ---------- Map sub-component ---------- */

function StateMap({ hospitals }: { hospitals: StateHospital[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasourceRef = useRef<any>(null);
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

      const withCoords = hospitals.filter(h => h.latitude != null && h.longitude != null);
      // compute bounding box
      let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
      for (const h of withCoords) {
        if (h.latitude! < minLat) minLat = h.latitude!;
        if (h.latitude! > maxLat) maxLat = h.latitude!;
        if (h.longitude! < minLon) minLon = h.longitude!;
        if (h.longitude! > maxLon) maxLon = h.longitude!;
      }

      const map = new atlas.Map(mapRef.current!, {
        authOptions,
        style: 'road',
        language: 'en-US',
      });

      map.events.add('ready', () => {
        // fit to state bounds
        if (withCoords.length > 0) {
          map.setCamera({
            bounds: [minLon - 0.5, minLat - 0.5, maxLon + 0.5, maxLat + 0.5],
            padding: 40,
          });
        }

        const datasource = new atlas.source.DataSource();
        map.sources.add(datasource);
        datasourceRef.current = datasource;

        for (const h of withCoords) {
          datasource.add(new atlas.data.Feature(
            new atlas.data.Point([h.longitude!, h.latitude!]),
            {
              facility_id: h.facility_id,
              facility_name: h.facility_name,
              city: h.city,
              star_rating: h.star_rating ?? 0,
              mspb_ratio: h.mspb_ratio,
              payment_reduction: h.payment_reduction,
            },
          ));
        }

        const bubbleLayer = new atlas.layer.BubbleLayer(datasource, undefined, {
          radius: 6,
          color: [
            'match', ['get', 'star_rating'],
            5, '#22c55e', 4, '#84cc16', 3, '#eab308', 2, '#f97316', 1, '#ef4444',
            '#94a3b8',
          ],
          strokeColor: 'white',
          strokeWidth: 1,
          opacity: 0.85,
        });
        map.layers.add(bubbleLayer);

        const popup = new atlas.Popup({ closeButton: true, pixelOffset: [0, -10] });
        map.events.add('click', bubbleLayer, (e) => {
          if (!e.shapes || e.shapes.length === 0) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const shape = e.shapes[0] as any;
          const p = shape.getProperties?.() ?? shape.properties;
          const coords = shape.getCoordinates?.() ?? shape.geometry?.coordinates;
          if (!p || !coords) return;
          const stars = p.star_rating ? '⭐'.repeat(p.star_rating) : 'Not rated';
          const mspb = p.mspb_ratio != null ? p.mspb_ratio.toFixed(3) : 'N/A';
          const hac = p.payment_reduction === 'Yes'
            ? '<br/><span style="color:#f87171;">HAC Penalized</span>' : '';
          popup.setOptions({
            content: `
              <div style="padding:8px;max-width:220px;font-size:13px;background:#ffffff;color:#1e293b;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                <strong><a href="/dashboards/hospital-compass/${p.facility_id}" style="color:#2563eb;text-decoration:none;">${p.facility_name}</a></strong>
                <br/>${p.city}
                <br/>${stars}
                <br/>MSPB: <strong>${mspb}</strong>${hac}
              </div>`,
            position: coords,
          });
          popup.open(map);
        });

        setLoaded(true);
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to load map');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render data when hospitals change (filters)
  useEffect(() => {
    const ds = datasourceRef.current;
    if (!ds || !loaded) return;
    ds.clear();

    const withCoords = hospitals.filter((h: StateHospital) => h.latitude != null && h.longitude != null);
    import('azure-maps-control').then((atlas) => {
      for (const h of withCoords) {
        ds.add(new atlas.data.Feature(
          new atlas.data.Point([h.longitude!, h.latitude!]),
          {
            facility_id: h.facility_id,
            facility_name: h.facility_name,
            city: h.city,
            star_rating: h.star_rating ?? 0,
            mspb_ratio: h.mspb_ratio,
            payment_reduction: h.payment_reduction,
          },
        ));
      }
    });
  }, [hospitals, loaded]);

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
      <div className="rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground" style={{ borderColor: 'var(--border)', minHeight: 450 }}>
        {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ minHeight: 450, border: '1px solid var(--border)' }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 450 }} />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(255,255,255,0.92)', color: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
        <div className="font-semibold mb-1">Star Rating</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#ef4444' }} /> 1
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#f97316' }} /> 2
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#eab308' }} /> 3
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#84cc16' }} /> 4
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#22c55e' }} /> 5
        </div>
      </div>
    </div>
  );
}

/* ---------- Summary card ---------- */

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4" style={{ borderColor: 'var(--border)' }}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

/* ---------- Main client component ---------- */

export function StateDetailClient({ stateCode, stateName, hospitals, summary }: Props) {
  const [search, setSearch] = useState('');
  const [minStars, setMinStars] = useState(0);
  const [hospitalType, setHospitalType] = useState('');
  const [mortFilter, setMortFilter] = useState('');
  const [hacFilter, setHacFilter] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('');

  const hospitalTypes = useMemo(() => {
    const types = new Set(hospitals.map(h => h.hospital_type).filter(Boolean) as string[]);
    return [...types].sort();
  }, [hospitals]);

  const filtered = useMemo(() => {
    return hospitals.filter(h => {
      if (search && !h.facility_name.toLowerCase().includes(search.toLowerCase()) && !h.city.toLowerCase().includes(search.toLowerCase())) return false;
      if (minStars > 0 && (h.star_rating == null || h.star_rating < minStars)) return false;
      if (hospitalType && h.hospital_type !== hospitalType) return false;
      if (mortFilter === 'better' && (h.mort_better == null || h.mort_better === 0)) return false;
      if (mortFilter === 'worse' && (h.mort_worse == null || h.mort_worse === 0)) return false;
      if (hacFilter === 'penalized' && h.payment_reduction !== 'Yes') return false;
      if (hacFilter === 'not_penalized' && h.payment_reduction === 'Yes') return false;
      if (emergencyFilter === 'yes' && h.emergency_services !== 'Yes') return false;
      if (emergencyFilter === 'no' && h.emergency_services === 'Yes') return false;
      return true;
    });
  }, [hospitals, search, minStars, hospitalType, mortFilter, hacFilter, emergencyFilter]);

  const hasFilters = search !== '' || minStars > 0 || hospitalType !== '' || mortFilter !== '' || hacFilter !== '' || emergencyFilter !== '';

  const resetFilters = () => {
    setSearch('');
    setMinStars(0);
    setHospitalType('');
    setMortFilter('');
    setHacFilter('');
    setEmergencyFilter('');
  };

  const columns: DataTableColumn<StateHospital>[] = [
    {
      key: 'facility_name',
      header: 'Hospital',
      sortable: true,
      render: (v, row) => (
        <Link href={`/dashboards/hospital-compass/${row.facility_id}`} className="font-medium text-blue-600 hover:underline max-w-[220px] truncate block">
          {v as string}
        </Link>
      ),
    },
    { key: 'city', header: 'City', sortable: true },
    {
      key: 'star_rating',
      header: 'Stars',
      sortable: true,
      align: 'center',
      render: (v) => {
        const val = v as number | null;
        if (val == null) return <span className="text-muted-foreground text-xs">N/A</span>;
        const color = STAR_COLORS[val] ?? '#94a3b8';
        return (
          <div className="flex items-center gap-1">
            <span className="font-bold" style={{ color }}>{val}</span>
            <span style={{ color }}>{'★'.repeat(val)}</span>
          </div>
        );
      },
    },
    {
      key: 'hospital_type',
      header: 'Type',
      sortable: true,
      render: (v) => {
        const t = v as string | null;
        if (!t) return '—';
        const short = t.replace(' Hospitals', '').replace(' Hospital', '');
        return <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">{short}</span>;
      },
    },
    {
      key: 'mspb_ratio',
      header: 'MSPB',
      sortable: true,
      align: 'right',
      render: (v) => {
        const ratio = v as number | null;
        if (ratio == null) return <span className="text-muted-foreground text-xs">N/A</span>;
        return <span className={`font-mono font-semibold ${getMSPBColor(ratio)}`}>{ratio.toFixed(3)}</span>;
      },
    },
    {
      key: 'mort_better',
      header: 'Mortality',
      sortable: true,
      render: (_v, row) => {
        const b = row.mort_better ?? 0;
        const s = row.mort_same ?? 0;
        const w = row.mort_worse ?? 0;
        if (b === 0 && s === 0 && w === 0) return <span className="text-muted-foreground text-xs">N/A</span>;
        return (
          <div className="flex items-center gap-1 text-xs">
            {b > 0 && <span className="px-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{b}B</span>}
            {s > 0 && <span className="px-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{s}S</span>}
            {w > 0 && <span className="px-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{w}W</span>}
          </div>
        );
      },
    },
    {
      key: 'payment_reduction',
      header: 'HAC',
      sortable: true,
      align: 'center',
      render: (v) => {
        if (v === 'Yes') return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Penalized</span>;
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: 'emergency_services',
      header: 'ER',
      sortable: true,
      align: 'center',
      render: (v) => v === 'Yes' ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground">—</span>,
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboards/geographic" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Geographic Atlas
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{stateName} ({stateCode})</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {summary.hospital_count} hospitals · Star rank #{summary.star_rank} of {summary.total_states} states
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Hospitals"
          value={summary.hospital_count.toLocaleString()}
        />
        <SummaryCard
          label="Avg Star Rating"
          value={summary.avg_star_rating?.toFixed(2) ?? 'N/A'}
          sub={summary.national_avg_star != null ? `National: ${summary.national_avg_star.toFixed(2)}` : undefined}
        />
        <SummaryCard
          label="Avg MSPB"
          value={summary.avg_mspb?.toFixed(3) ?? 'N/A'}
          sub={summary.national_avg_mspb != null ? `National: ${summary.national_avg_mspb.toFixed(3)}` : undefined}
        />
        <SummaryCard
          label="HAC Penalized"
          value={String(summary.hac_penalized_count)}
          sub={`${((summary.hac_penalized_count / summary.hospital_count) * 100).toFixed(0)}% of hospitals`}
        />
      </div>

      {/* Filters */}
      <FilterBar onReset={resetFilters} showReset={hasFilters}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search hospital or city..." className="w-56" />
        <select value={minStars} onChange={e => setMinStars(Number(e.target.value))} className={SELECT_CLS} aria-label="Min stars">
          <option value={0}>Any stars</option>
          <option value={1}>1+ stars</option>
          <option value={2}>2+ stars</option>
          <option value={3}>3+ stars</option>
          <option value={4}>4+ stars</option>
          <option value={5}>5 stars only</option>
        </select>
        <select value={hospitalType} onChange={e => setHospitalType(e.target.value)} className={SELECT_CLS} aria-label="Hospital type">
          <option value="">All types</option>
          {hospitalTypes.map(t => <option key={t} value={t}>{t.replace(' Hospitals', '').replace(' Hospital', '')}</option>)}
        </select>
        <select value={mortFilter} onChange={e => setMortFilter(e.target.value)} className={SELECT_CLS} aria-label="Mortality">
          <option value="">All mortality</option>
          <option value="better">Better than national</option>
          <option value="worse">Worse than national</option>
        </select>
        <select value={hacFilter} onChange={e => setHacFilter(e.target.value)} className={SELECT_CLS} aria-label="HAC status">
          <option value="">All HAC</option>
          <option value="not_penalized">Not penalized</option>
          <option value="penalized">Penalized</option>
        </select>
        <select value={emergencyFilter} onChange={e => setEmergencyFilter(e.target.value)} className={SELECT_CLS} aria-label="Emergency services">
          <option value="">All ER</option>
          <option value="yes">Has ER</option>
          <option value="no">No ER</option>
        </select>
      </FilterBar>

      {/* Map */}
      <div className="mt-4 mb-6">
        <StateMap hospitals={filtered} />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground mb-2">
        {filtered.length === hospitals.length
          ? `${hospitals.length} hospitals`
          : `${filtered.length} of ${hospitals.length} hospitals`}
      </div>

      {/* Hospital table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={row => row.facility_id}
          defaultSort={{ key: 'star_rating', direction: 'desc' }}
          pageSize={25}
        />
      </div>
    </>
  );
}
