import type { Metadata } from 'next';
import { query, queryParameterized } from '@/lib/duckdb/instance';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MeasureDetailClient } from './MeasureDetailClient';

export const dynamic = 'force-dynamic';

const VALID_MEASURES: Record<string, string> = {
  'MORT_30_AMI': '30-Day Mortality: Heart Attack (AMI)',
  'MORT_30_HF': '30-Day Mortality: Heart Failure',
  'MORT_30_PN': '30-Day Mortality: Pneumonia',
  'MORT_30_COPD': '30-Day Mortality: COPD',
  'MORT_30_CABG': '30-Day Mortality: CABG Surgery',
  'COMP_HIP_KNEE': 'Complications: Hip/Knee Replacement',
};

type Props = { params: Promise<{ measureId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { measureId } = await params;
  return { title: VALID_MEASURES[measureId] ?? 'Clinical Outcome Detail' };
}

export default async function MeasureDetailPage({ params }: Props) {
  const { measureId } = await params;

  if (!VALID_MEASURES[measureId]) notFound();

  const [stateAvgs, topHospitals, bottomHospitals, benchmarkDist, financialCorrelation] = await Promise.all([
    // State-level average scores
    queryParameterized<{
      state: string; avg_score: number; hospital_count: number; better: number; worse: number;
    }>(`
      SELECT
        m.state,
        ROUND(AVG(m.score), 2) AS avg_score,
        COUNT(*) AS hospital_count,
        SUM(CASE WHEN m.compared_to_national ILIKE '%better%' THEN 1 ELSE 0 END) AS better,
        SUM(CASE WHEN m.compared_to_national ILIKE '%worse%' THEN 1 ELSE 0 END) AS worse
      FROM v_mortality m
      WHERE m.measure_id = $measure_id AND m.score IS NOT NULL
      GROUP BY m.state
      ORDER BY avg_score
    `, { measure_id: measureId }),

    // Top 20 best-performing hospitals
    queryParameterized<{
      facility_id: string; facility_name: string; state: string;
      score: number; compared_to_national: string; denominator: number | null;
    }>(`
      SELECT facility_id, facility_name, state, score, compared_to_national, denominator
      FROM v_mortality
      WHERE measure_id = $measure_id AND score IS NOT NULL
      ORDER BY score ASC
      LIMIT 20
    `, { measure_id: measureId }),

    // Bottom 20 worst-performing hospitals
    queryParameterized<{
      facility_id: string; facility_name: string; state: string;
      score: number; compared_to_national: string; denominator: number | null;
    }>(`
      SELECT facility_id, facility_name, state, score, compared_to_national, denominator
      FROM v_mortality
      WHERE measure_id = $measure_id AND score IS NOT NULL
      ORDER BY score DESC
      LIMIT 20
    `, { measure_id: measureId }),

    // Benchmark distribution
    queryParameterized<{ compared_to_national: string; cnt: number }>(`
      SELECT compared_to_national, COUNT(*) AS cnt
      FROM v_mortality
      WHERE measure_id = $measure_id AND compared_to_national IS NOT NULL
      GROUP BY compared_to_national
    `, { measure_id: measureId }),

    // Financial correlation: mortality score vs MSPB ratio
    queryParameterized<{
      facility_id: string; facility_name: string; state: string;
      score: number; mspb_ratio: number | null; star_rating: number | null;
    }>(`
      SELECT m.facility_id, m.facility_name, m.state, m.score,
             s.mspb_ratio, h.star_rating
      FROM v_mortality m
      LEFT JOIN v_mspb s ON m.facility_id = s.facility_id
      LEFT JOIN v_hospital_profile h ON m.facility_id = h.facility_id
      WHERE m.measure_id = $measure_id AND m.score IS NOT NULL
      ORDER BY m.score
    `, { measure_id: measureId }),
  ]);

  // Get national rate
  const nationalRow = await queryParameterized<{ national_rate: number | null }>(`
    SELECT TRY_CAST("National Rate" AS DOUBLE) AS national_rate
    FROM complications_deaths_national
    WHERE "Measure ID" = $measure_id
    LIMIT 1
  `, { measure_id: measureId });
  const nationalRate = nationalRow[0]?.national_rate ?? null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link
        href="/dashboards/clinical-outcomes"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Clinical Outcomes
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {VALID_MEASURES[measureId]}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Explore geographic distribution, hospital rankings, and financial correlations for this measure.
        </p>
      </div>
      <MeasureDetailClient
        measureId={measureId}
        measureLabel={VALID_MEASURES[measureId]}
        nationalRate={nationalRate}
        stateAvgs={stateAvgs}
        topHospitals={topHospitals}
        bottomHospitals={bottomHospitals}
        benchmarkDist={benchmarkDist}
        financialCorrelation={financialCorrelation}
      />
    </div>
  );
}
