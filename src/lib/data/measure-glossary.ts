/**
 * Single-source-of-truth dictionary for all CMS quality measure terminology.
 * Used by InfoTooltip, the About page, and dashboard page descriptions.
 */

export interface MeasureEntry {
  /** Human-friendly name */
  label: string;
  /** 1–2 sentence tooltip text */
  shortDescription: string;
  /** How to interpret the number */
  interpretation?: string;
  /** Which CMS program produces this measure */
  dataSource?: string;
  /** Anchor ID for the About page (links to /about#<anchor>) */
  aboutAnchor?: string;
}

export const MEASURE_GLOSSARY: Record<string, MeasureEntry> = {
  // ─── Star Ratings ──────────────────────────────────────
  star_rating: {
    label: 'Overall Hospital Star Rating',
    shortDescription:
      'CMS assigns each hospital an overall quality star rating (1–5 stars) based on performance across five groups of measures: mortality, safety of care, readmission, patient experience, and timely & effective care.',
    interpretation:
      '5 stars = best performance; 1 star = lowest. Stars are calculated using a latent variable model that clusters hospitals into five groups.',
    dataSource: 'CMS Care Compare Overall Hospital Quality Star Rating',
    aboutAnchor: 'star-ratings',
  },

  // ─── Healthcare-Associated Infections (HAI) ────────────
  sir: {
    label: 'Standardized Infection Ratio (SIR)',
    shortDescription:
      'The SIR compares the actual number of healthcare-associated infections (HAIs) at a hospital to the number that would be predicted based on a national baseline.',
    interpretation:
      'SIR < 1.0 = fewer infections than expected (better). SIR = 1.0 = same as expected. SIR > 1.0 = more infections than expected (worse).',
    dataSource: 'CDC National Healthcare Safety Network (NHSN)',
    aboutAnchor: 'safety-hai',
  },
  HAI_1_SIR: {
    label: 'CLABSI – Central Line-Associated Bloodstream Infection',
    shortDescription:
      'A serious infection that occurs when bacteria enter the bloodstream through a central venous catheter (a tube placed in a large vein for medical treatment).',
    interpretation:
      'Measured as an SIR. Values below 1.0 indicate fewer infections than the national baseline.',
    dataSource: 'CDC NHSN via CMS Hospital Compare',
    aboutAnchor: 'safety-hai',
  },
  HAI_2_SIR: {
    label: 'CAUTI – Catheter-Associated Urinary Tract Infection',
    shortDescription:
      'A urinary tract infection linked to the use of a urinary catheter. These are among the most common hospital-acquired infections.',
    interpretation:
      'Measured as an SIR. Values below 1.0 indicate fewer infections than the national baseline.',
    dataSource: 'CDC NHSN via CMS Hospital Compare',
    aboutAnchor: 'safety-hai',
  },
  HAI_3_SIR: {
    label: 'SSI (Colon) – Surgical Site Infection after Colon Surgery',
    shortDescription:
      'An infection that develops at or near the surgical incision site within 30 days of colon surgery.',
    interpretation:
      'Measured as an SIR. Values below 1.0 indicate fewer infections than the national baseline.',
    dataSource: 'CDC NHSN via CMS Hospital Compare',
    aboutAnchor: 'safety-hai',
  },
  HAI_4_SIR: {
    label: 'SSI (Abd) – Surgical Site Infection after Abdominal Hysterectomy',
    shortDescription:
      'An infection that develops at or near the surgical incision site within 30 days of abdominal hysterectomy.',
    interpretation:
      'Measured as an SIR. Values below 1.0 indicate fewer infections than the national baseline.',
    dataSource: 'CDC NHSN via CMS Hospital Compare',
    aboutAnchor: 'safety-hai',
  },
  HAI_5_SIR: {
    label: 'MRSA Bacteremia',
    shortDescription:
      'Methicillin-Resistant Staphylococcus Aureus — a type of antibiotic-resistant staph bacteria that can cause dangerous bloodstream infections in hospitalized patients.',
    interpretation:
      'Measured as an SIR. Values below 1.0 indicate fewer infections than the national baseline.',
    dataSource: 'CDC NHSN via CMS Hospital Compare',
    aboutAnchor: 'safety-hai',
  },
  HAI_6_SIR: {
    label: 'CDI – Clostridioides difficile Infection',
    shortDescription:
      'C. difficile is a bacterium that causes inflammation of the colon. Infections often occur in patients who have been on antibiotics and are in healthcare settings.',
    interpretation:
      'Measured as an SIR. Values below 1.0 indicate fewer infections than the national baseline.',
    dataSource: 'CDC NHSN via CMS Hospital Compare',
    aboutAnchor: 'safety-hai',
  },

  // ─── HAC Reduction Program ─────────────────────────────
  hac: {
    label: 'Hospital-Acquired Condition Reduction Program',
    shortDescription:
      'CMS penalizes hospitals that rank in the worst-performing quartile (top 25%) for hospital-acquired conditions. Penalized hospitals receive a 1% reduction in total Medicare payments.',
    interpretation:
      'Higher HAC scores indicate worse performance. Hospitals in the bottom quartile receive a payment reduction.',
    dataSource: 'CMS Hospital-Acquired Condition Reduction Program',
    aboutAnchor: 'hac-program',
  },

  // ─── HCAHPS / Patient Experience ──────────────────────
  hcahps: {
    label: 'HCAHPS (Hospital Consumer Assessment of Healthcare Providers and Systems)',
    shortDescription:
      'HCAHPS is the first national, standardized patient survey measuring hospital patients\u2019 perspectives on their care. Results are publicly reported to encourage quality improvement.',
    interpretation:
      'Star ratings (1–5) are derived from patient survey responses. Higher stars = better patient experience.',
    dataSource: 'CMS HCAHPS Survey',
    aboutAnchor: 'hcahps',
  },
  H_COMP_1_STAR_RATING: {
    label: 'Nurse Communication',
    shortDescription:
      'How well nurses communicated with patients during their hospital stay — including courtesy, listening, and clear explanations.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_COMP_2_STAR_RATING: {
    label: 'Doctor Communication',
    shortDescription:
      'How well doctors communicated with patients — including courtesy, listening, and clear explanations of care.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_COMP_3_STAR_RATING: {
    label: 'Staff Responsiveness',
    shortDescription:
      'How quickly hospital staff responded to patients when they pressed the call button or needed help getting to the bathroom.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_COMP_5_STAR_RATING: {
    label: 'Communication About Medicines',
    shortDescription:
      'How well hospital staff explained new medications — including what the medicine was for and possible side effects.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_COMP_6_STAR_RATING: {
    label: 'Discharge Information',
    shortDescription:
      'Whether patients received clear information about what to do during recovery at home, including symptoms to watch for.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_COMP_7_STAR_RATING: {
    label: 'Care Transition',
    shortDescription:
      'How well patients understood their care plan when transitioning from hospital to home — including responsibilities, medications, and follow-up.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_CLEAN_STAR_RATING: {
    label: 'Cleanliness',
    shortDescription:
      'How clean patients rated the hospital room and bathroom during their stay.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_QUIET_STAR_RATING: {
    label: 'Quietness',
    shortDescription:
      'How quiet patients rated the hospital environment at night during their stay.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_HSP_RATING_STAR_RATING: {
    label: 'Overall Hospital Rating',
    shortDescription:
      'Patients\u2019 overall rating of the hospital on a scale of 0 to 10, converted to a star rating.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_RECMND_STAR_RATING: {
    label: 'Recommend Hospital',
    shortDescription:
      'Whether patients would definitely recommend the hospital to friends and family.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  H_STAR_RATING: {
    label: 'Overall HCAHPS Star Rating',
    shortDescription:
      'A composite star rating summarizing all HCAHPS survey domains into a single 1–5 star score for patient experience.',
    interpretation: 'Star rating from patient survey responses. 5 = excellent, 1 = poor.',
    aboutAnchor: 'hcahps',
  },
  linear_mean: {
    label: 'Linear Mean Score',
    shortDescription:
      'The average patient response score on the underlying numerical scale before conversion to star ratings. Represents the raw survey performance.',
    interpretation:
      'Higher values indicate better patient responses. Specific scales vary by domain.',
    aboutAnchor: 'hcahps',
  },

  // ─── Clinical Outcomes / Mortality ─────────────────────
  mortality: {
    label: '30-Day Mortality Rate',
    shortDescription:
      'The percentage of patients who died within 30 days of admission for a given condition. Rates are risk-adjusted to account for patient age, health status, and other factors.',
    interpretation:
      'Lower rates are better. "Better than national" means the hospital has fewer deaths than expected; "Worse" means more.',
    dataSource: 'CMS Hospital Compare – Complications and Deaths',
    aboutAnchor: 'clinical-outcomes',
  },
  MORT_30_AMI: {
    label: '30-Day Mortality: Heart Attack (AMI)',
    shortDescription:
      'Risk-adjusted rate of death within 30 days of hospital admission for acute myocardial infarction (heart attack).',
    interpretation:
      'Lower is better. Compared to national benchmark as Better / No Different / Worse.',
    aboutAnchor: 'clinical-outcomes',
  },
  MORT_30_HF: {
    label: '30-Day Mortality: Heart Failure',
    shortDescription:
      'Risk-adjusted rate of death within 30 days of hospital admission for heart failure.',
    interpretation:
      'Lower is better. Compared to national benchmark as Better / No Different / Worse.',
    aboutAnchor: 'clinical-outcomes',
  },
  MORT_30_PN: {
    label: '30-Day Mortality: Pneumonia',
    shortDescription:
      'Risk-adjusted rate of death within 30 days of hospital admission for pneumonia.',
    interpretation:
      'Lower is better. Compared to national benchmark as Better / No Different / Worse.',
    aboutAnchor: 'clinical-outcomes',
  },
  MORT_30_COPD: {
    label: '30-Day Mortality: COPD',
    shortDescription:
      'Risk-adjusted rate of death within 30 days of hospital admission for chronic obstructive pulmonary disease.',
    interpretation:
      'Lower is better. Compared to national benchmark as Better / No Different / Worse.',
    aboutAnchor: 'clinical-outcomes',
  },
  MORT_30_CABG: {
    label: '30-Day Mortality: CABG Surgery',
    shortDescription:
      'Risk-adjusted rate of death within 30 days of coronary artery bypass graft (open-heart bypass) surgery.',
    interpretation:
      'Lower is better. Compared to national benchmark as Better / No Different / Worse.',
    aboutAnchor: 'clinical-outcomes',
  },
  COMP_HIP_KNEE: {
    label: 'Hip/Knee Replacement Complications',
    shortDescription:
      'Rate of serious complications within 90 days of elective primary total hip or knee replacement surgery, including heart attack, pneumonia, or surgical site infection.',
    interpretation:
      'Lower is better. Compared to national benchmark as Better / No Different / Worse.',
    aboutAnchor: 'clinical-outcomes',
  },
  benchmark: {
    label: 'Compared to National Benchmark',
    shortDescription:
      'Each hospital\u2019s measure performance is statistically compared to the national rate. Results are classified as "Better than the National Rate," "No Different than the National Rate," or "Worse than the National Rate."',
    interpretation:
      'Green (Better) = hospital outperforms national average. Yellow (Same/No Different) = statistically similar. Red (Worse) = underperforms.',
    aboutAnchor: 'clinical-outcomes',
  },

  // ─── Spending / MSPB ──────────────────────────────────
  mspb: {
    label: 'Medicare Spending Per Beneficiary (MSPB)',
    shortDescription:
      'MSPB measures the average spending for Medicare patients at a hospital, covering all care from 3 days before admission through 30 days after discharge. It\u2019s expressed as a ratio to the national median.',
    interpretation:
      'MSPB = 1.0 means spending matches the national median. Below 1.0 = more cost-efficient. Above 1.0 = higher spending than average.',
    dataSource: 'CMS Medicare Spending Per Beneficiary measure',
    aboutAnchor: 'spending-efficiency',
  },

  // ─── Value-Based Purchasing (HVBP) ────────────────────
  hvbp: {
    label: 'Hospital Value-Based Purchasing (HVBP)',
    shortDescription:
      'A CMS program that adjusts hospital Medicare payments based on care quality. Hospitals earn or lose up to 2% of their base DRG payments depending on their Total Performance Score.',
    interpretation:
      'Higher TPS = better performance = potential payment bonus. Lower TPS = potential payment penalty.',
    dataSource: 'CMS Hospital Value-Based Purchasing Program',
    aboutAnchor: 'hvbp',
  },
  tps: {
    label: 'Total Performance Score (TPS)',
    shortDescription:
      'The HVBP composite score (0–100) combining four domains: Clinical Outcomes (25%), Safety (25%), Person & Community Engagement (25%), and Efficiency & Cost Reduction (25%).',
    interpretation:
      'Higher is better. Determines whether a hospital receives a bonus or penalty to its Medicare DRG payments.',
    dataSource: 'CMS Hospital Value-Based Purchasing Program',
    aboutAnchor: 'hvbp',
  },
  hvbp_clinical: {
    label: 'HVBP Clinical Outcomes Domain',
    shortDescription:
      'Evaluates 30-day mortality rates for heart attack, heart failure, pneumonia, and CABG. Worth 25% of the Total Performance Score.',
    interpretation: 'Higher domain score = better clinical outcomes.',
    aboutAnchor: 'hvbp',
  },
  hvbp_safety: {
    label: 'HVBP Safety Domain',
    shortDescription:
      'Evaluates healthcare-associated infections (CLABSI, CAUTI, SSI, MRSA, CDI) and PSI-90 patient safety composite. Worth 25% of the Total Performance Score.',
    interpretation: 'Higher domain score = fewer safety incidents.',
    aboutAnchor: 'hvbp',
  },
  hvbp_engagement: {
    label: 'HVBP Person & Community Engagement Domain',
    shortDescription:
      'Based on HCAHPS patient survey scores across communication, responsiveness, and overall hospital rating. Worth 25% of the Total Performance Score.',
    interpretation: 'Higher domain score = better patient satisfaction.',
    aboutAnchor: 'hvbp',
  },
  hvbp_efficiency: {
    label: 'HVBP Efficiency & Cost Reduction Domain',
    shortDescription:
      'Based on the Medicare Spending Per Beneficiary (MSPB) measure. Rewards hospitals that manage Medicare costs efficiently. Worth 25% of the Total Performance Score.',
    interpretation: 'Higher domain score = more efficient spending.',
    aboutAnchor: 'hvbp',
  },

  // ─── HRRP ─────────────────────────────────────────────
  hrrp: {
    label: 'Hospital Readmissions Reduction Program (HRRP)',
    shortDescription:
      'CMS penalizes hospitals with excess 30-day readmission rates for heart attack, heart failure, pneumonia, COPD, hip/knee replacement, and CABG. Penalties can reduce payments by up to 3%.',
    interpretation:
      'Excess Readmission Ratio > 1.0 = more readmissions than expected (penalty risk). Ratio ≤ 1.0 = at or below expected.',
    dataSource: 'CMS Hospital Readmissions Reduction Program',
    aboutAnchor: 'hrrp',
  },
  excess_readmission_ratio: {
    label: 'Excess Readmission Ratio',
    shortDescription:
      'The ratio of a hospital\u2019s predicted 30-day readmissions to its expected readmissions (based on an average hospital with similar patients). Greater than 1.0 means more readmissions than expected.',
    interpretation:
      'Ratio > 1.0 = more readmissions than expected (penalty applies). Ratio ≤ 1.0 = at or below expected (no penalty).',
    aboutAnchor: 'hrrp',
  },
};

/** Look up a measure entry, trying the key as-is, then common transformations */
export function getMeasureInfo(key: string): MeasureEntry | undefined {
  return (
    MEASURE_GLOSSARY[key] ??
    MEASURE_GLOSSARY[key.replace(/_SIR$/, '_SIR')] ??
    undefined
  );
}
