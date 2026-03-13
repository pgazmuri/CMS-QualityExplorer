import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Building2 } from 'lucide-react';
import { getHospitalById } from '@/lib/duckdb/queries/hospitals';
import { getMortalityForHospital } from '@/lib/duckdb/queries/outcomes';
import { getHAISIRsForHospital, getHACForHospital } from '@/lib/duckdb/queries/safety';
import { getMSPBForHospital } from '@/lib/duckdb/queries/spending';
import { getHVBPTPSForHospital, getHRRPForHospital } from '@/lib/duckdb/queries/programs';
import { getHCAHPSStarsForHospital } from '@/lib/duckdb/queries/experience';
import { StarRatingBadge } from '@/components/dashboards/StarRatingBadge';
import { BenchmarkBadge } from '@/components/dashboards/BenchmarkBadge';
import { InfoTooltip } from '@/components/dashboards/InfoTooltip';
import { formatScore, formatSIR, formatMSPBRatio } from '@/lib/utils/format';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}): Promise<Metadata> {
  const { facilityId } = await params;
  const hospital = await getHospitalById(facilityId);
  return { title: hospital?.facility_name ?? 'Hospital Profile' };
}

export const dynamic = 'force-dynamic';

export default async function HospitalProfilePage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}) {
  const { facilityId } = await params;

  const [hospital, mortality, haiSIRs, hac, mspb, hvbp, hrrp, hcahps] = await Promise.all([
    getHospitalById(facilityId),
    getMortalityForHospital(facilityId),
    getHAISIRsForHospital(facilityId),
    getHACForHospital(facilityId),
    getMSPBForHospital(facilityId),
    getHVBPTPSForHospital(facilityId),
    getHRRPForHospital(facilityId),
    getHCAHPSStarsForHospital(facilityId),
  ]);

  if (!hospital) notFound();

  const overallHcahps = hcahps.find((h) => h.measure_id === 'H_STAR_RATING');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href="/dashboards/hospital-compass"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      {/* Hospital header */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{hospital.facility_name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
              <MapPin className="h-4 w-4" />
              <span>{[hospital.address, hospital.city, hospital.state, hospital.zip].filter(Boolean).join(', ')}</span>
            </div>
            {hospital.phone && (
              <div className="flex items-center gap-1.5 mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <Phone className="h-4 w-4" />
                <span>{hospital.phone}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StarRatingBadge rating={hospital.star_rating} />
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)]">{hospital.hospital_type}</span>
          </div>
        </div>

        {/* Quick stat grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <QuickStat label="Emergency Services" value={hospital.emergency_services ?? 'N/A'} />
          <QuickStat label="Ownership" value={hospital.ownership ?? 'N/A'} />
          <QuickStat label="Facility ID" value={hospital.facility_id} mono />
          <QuickStat label="MSPB Ratio" value={formatScore(mspb?.mspb_ratio, 3)} />
        </div>
      </div>

      {/* Domain cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Mortality */}
        <DomainCard title="Mortality" href="/dashboards/clinical-outcomes" tooltipId="mortality">
          {mortality.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No data available</p>
          ) : (
            <div className="space-y-1.5">
              {mortality.slice(0, 4).map((m) => (
                <div key={m.measure_id} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1">{m.measure_id.replace('MORT_30_', '')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono">{formatScore(m.score)}</span>
                    <BenchmarkBadge value={m.compared_to_national} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DomainCard>

        {/* HAI Safety */}
        <DomainCard title="Healthcare-Associated Infections" href="/dashboards/safety" tooltipId="sir">
          {haiSIRs.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No data available</p>
          ) : (
            <div className="space-y-1.5">
              {haiSIRs.slice(0, 4).map((h) => (
                <div key={h.measure_id} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1">{h.measure_id.replace('_SIR', '')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono">{formatSIR(h.sir_value)}</span>
                    <BenchmarkBadge value={h.compared_to_national} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DomainCard>

        {/* Patient Experience */}
        <DomainCard title="Patient Experience (HCAHPS)" href="/dashboards/patient-experience" tooltipId="hcahps">
          {overallHcahps?.star_rating != null ? (
            <div>
              <StarRatingBadge rating={overallHcahps.star_rating} />
              <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                {overallHcahps.completed_surveys?.toLocaleString()} surveys
                {overallHcahps.response_rate != null && ` · ${overallHcahps.response_rate.toFixed(0)}% response rate`}
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No survey data</p>
          )}
        </DomainCard>

        {/* Spending */}
        <DomainCard title="Medicare Spending (MSPB)" href="/dashboards/spending-efficiency" tooltipId="mspb">
          {mspb ? (
            <div>
              <p className="text-lg font-bold font-mono">{formatScore(mspb.mspb_ratio, 3)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {mspb.mspb_ratio != null && mspb.mspb_ratio < 1
                  ? 'Below national average (more efficient)'
                  : mspb.mspb_ratio != null && mspb.mspb_ratio > 1
                  ? 'Above national average'
                  : 'At national average'}
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No MSPB data</p>
          )}
        </DomainCard>

        {/* HVBP */}
        <DomainCard title="Value-Based Purchasing" href="/dashboards/value-based-programs" tooltipId="hvbp">
          {hvbp ? (
            <div className="space-y-1">
              <p className="text-lg font-bold">{hvbp.tps != null ? hvbp.tps.toFixed(0) : 'N/A'}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Performance Score (FY{hvbp.fiscal_year})</p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {[
                  ['Clinical', hvbp.clinical_score],
                  ['Safety', hvbp.safety_score],
                  ['Engagement', hvbp.engagement_score],
                  ['Efficiency', hvbp.efficiency_score],
                ].map(([label, val]) => (
                  <div key={label as string} className="text-xs">
                    <span style={{ color: 'var(--muted-foreground)' }}>{label}: </span>
                    <span className="font-medium">{val != null ? (val as number).toFixed(1) : 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No HVBP data</p>
          )}
        </DomainCard>

        {/* HAC */}
        <DomainCard title="HAC Reduction Program" href="/dashboards/value-based-programs" tooltipId="hac">
          {hac ? (
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{hac.hac_score != null ? hac.hac_score.toFixed(3) : 'N/A'}</p>
                {hac.payment_reduction === 'Yes' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Payment Reduced</span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                HAC Total Score (FY{hac.fiscal_year})
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No HAC data</p>
          )}
        </DomainCard>
      </div>

      {/* Readmissions table */}
      {hrrp.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <h3 className="font-semibold text-sm mb-3">Readmissions Reduction Program</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Condition</th>
                  <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Excess Ratio</th>
                  <th className="text-right pb-2 font-medium" style={{ color: 'var(--muted-foreground)' }}>Discharges</th>
                </tr>
              </thead>
              <tbody>
                {hrrp.map((r) => (
                  <tr key={r.measure_name} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1.5">{r.measure_name.replace(/-HRRP$/, '')}</td>
                    <td className="text-right py-1.5 font-mono">
                      <span className={r.excess_ratio != null && r.excess_ratio > 1 ? 'text-red-600' : 'text-green-600'}>
                        {r.excess_ratio != null ? r.excess_ratio.toFixed(4) : 'N/A'}
                      </span>
                    </td>
                    <td className="text-right py-1.5">{r.discharges?.toLocaleString() ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
      <p className={`text-sm font-medium mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function DomainCard({
  title, href, tooltipId, children,
}: { title: string; href: string; tooltipId?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border p-4 hover:shadow-md transition-all"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)' }}>
        {title}
        {tooltipId && <InfoTooltip measureId={tooltipId} size={12} />}
      </h3>
      {children}
    </Link>
  );
}
