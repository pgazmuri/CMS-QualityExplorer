export interface StateHospital {
  facility_id: string;
  facility_name: string;
  city: string;
  zip: string;
  hospital_type: string | null;
  ownership: string | null;
  emergency_services: string | null;
  star_rating: number | null;
  latitude: number | null;
  longitude: number | null;
  mort_better: number | null;
  mort_same: number | null;
  mort_worse: number | null;
  safety_better: number | null;
  safety_same: number | null;
  safety_worse: number | null;
  readm_better: number | null;
  readm_same: number | null;
  readm_worse: number | null;
  mspb_ratio: number | null;
  hac_score: number | null;
  payment_reduction: string | null;
  hcahps_overall: number | null;
}

export interface StateSummary {
  hospital_count: number;
  avg_star_rating: number | null;
  avg_mspb: number | null;
  hac_penalized_count: number;
  national_avg_star: number | null;
  national_avg_mspb: number | null;
  star_rank: number;
  total_states: number;
}
