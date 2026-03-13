export interface Hospital {
  facility_id: string;
  facility_name: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  phone: string | null;
  address: string | null;
  hospital_type: string | null;
  ownership: string | null;
  emergency_services: string | null;
  birthing_friendly: string | null;
  star_rating: 1 | 2 | 3 | 4 | 5 | null;
  mort_better: number | null;
  mort_same: number | null;
  mort_worse: number | null;
  safety_better: number | null;
  safety_same: number | null;
  safety_worse: number | null;
  readm_better: number | null;
  readm_same: number | null;
  readm_worse: number | null;
}

export type BenchmarkLabel = 'Better' | 'Same' | 'Worse' | 'Unknown';

export function normalizeBenchmark(raw: string | null | undefined): BenchmarkLabel {
  if (!raw) return 'Unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('better')) return 'Better';
  if (lower.includes('worse')) return 'Worse';
  if (lower.includes('no different') || lower.includes('same')) return 'Same';
  return 'Unknown';
}
