export interface MeasureDate {
  measure_id: string;
  measure_name: string;
  start_date: string | null;
  end_date: string | null;
}

export interface NationalBenchmark {
  measure_id: string;
  measure_name: string;
  national_rate: number | null;
}

export interface StateBenchmark extends NationalBenchmark {
  state: string;
}
