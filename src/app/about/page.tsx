import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  HeartPulse,
  DollarSign,
  Award,
  BarChart3,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About CMS Quality Reporting',
  description:
    'Learn how CMS measures and reports hospital quality — star ratings, safety, patient experience, clinical outcomes, spending, and value-based programs.',
};

const TOC = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'star-ratings', label: 'Hospital Star Ratings' },
  { id: 'safety-hai', label: 'Safety & Healthcare-Associated Infections' },
  { id: 'hcahps', label: 'Patient Experience (HCAHPS)' },
  { id: 'clinical-outcomes', label: 'Clinical Outcomes' },
  { id: 'spending-efficiency', label: 'Spending & Efficiency' },
  { id: 'hvbp', label: 'Value-Based Purchasing (HVBP)' },
  { id: 'hac-program', label: 'HAC Reduction Program' },
  { id: 'hrrp', label: 'Hospital Readmissions (HRRP)' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'data-sources', label: 'Data Sources & Freshness' },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-7 w-7 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">
            About CMS Quality Reporting
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          A comprehensive guide to understanding the measures, programs, and
          methodology behind hospital quality data published by the Centers for
          Medicare &amp; Medicaid Services (CMS).
        </p>
      </div>

      {/* Table of Contents */}
      <nav
        className="rounded-xl border p-5 mb-10"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <h2 className="text-sm font-semibold mb-3">Contents</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 list-decimal list-inside text-sm">
          {TOC.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="hover:underline text-blue-600 dark:text-blue-400"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ─── Sections ──────────────────────────────────────── */}
      <div className="space-y-12">
        {/* Introduction */}
        <Section id="introduction" icon={BookOpen} title="Introduction">
          <p>
            The Centers for Medicare &amp; Medicaid Services (CMS) publicly
            reports quality information for over 5,000 Medicare-certified
            hospitals in the United States through its{' '}
            <strong>Care Compare</strong> website. This data helps patients make
            informed decisions, and incentivizes hospitals to improve quality.
          </p>
          <p>
            Quality is assessed across multiple domains — safety, clinical outcomes,
            patient experience, spending efficiency, and readmission rates. CMS
            collects this data from hospitals, claims records, patient surveys,
            and the CDC&apos;s infection surveillance system. Data is typically updated
            quarterly and covers rolling periods of 1–3 years.
          </p>
          <p>
            This explorer presents that data interactively. The sections below
            explain what each measure means, how it&apos;s calculated, and how to
            interpret the numbers you see on our dashboards.
          </p>
        </Section>

        {/* Star Ratings */}
        <Section id="star-ratings" icon={Star} title="Hospital Star Ratings">
          <p>
            CMS assigns an <strong>Overall Hospital Quality Star Rating</strong>{' '}
            (1 to 5 stars) to each hospital that has enough reported data. The
            rating summarizes performance across five groups of quality measures:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Mortality</strong> — Risk-adjusted 30-day death rates</li>
            <li><strong>Safety of Care</strong> — Healthcare-associated infections and patient safety indicators</li>
            <li><strong>Readmission</strong> — Unplanned returns to the hospital within 30 days</li>
            <li><strong>Patient Experience</strong> — HCAHPS survey scores</li>
            <li><strong>Timely &amp; Effective Care</strong> — Evidence-based process measures</li>
          </ul>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
              How are stars calculated? (methodology)
            </summary>
            <div className="mt-2 text-sm space-y-2 pl-4 border-l-2" style={{ borderColor: 'var(--border)' }}>
              <p>
                CMS uses a <strong>latent variable model</strong> (similar to factor
                analysis) to group individual measures into the five categories above.
                Each category receives a group score, and the five group scores are
                combined into a summary score using a weighted average. Hospitals are
                then clustered into five groups (1–5 stars) using a k-means clustering
                algorithm applied to the summary scores.
              </p>
              <p>
                Weights are not fixed — they emerge from the model based on how reliably
                each group of measures performs. Hospitals must have data in at least 3
                of the 5 measure groups and meet minimum case-count thresholds to receive
                a star rating.
              </p>
            </div>
          </details>
        </Section>

        {/* Safety & HAI */}
        <Section id="safety-hai" icon={ShieldCheck} title="Safety & Healthcare-Associated Infections">
          <p>
            <strong>Healthcare-Associated Infections (HAIs)</strong> are infections
            patients acquire during the course of receiving healthcare treatment for
            other conditions. CMS tracks six types of HAIs using data reported to
            the CDC&apos;s National Healthcare Safety Network (NHSN):
          </p>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 font-semibold">Abbreviation</th>
                  <th className="text-left py-2 font-semibold">Full Name</th>
                  <th className="text-left py-2 font-semibold">What It Is</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-mono font-medium">CLABSI</td>
                  <td className="py-2">Central Line-Associated Bloodstream Infection</td>
                  <td className="py-2">Infection from a central venous catheter</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-mono font-medium">CAUTI</td>
                  <td className="py-2">Catheter-Associated Urinary Tract Infection</td>
                  <td className="py-2">Infection from a urinary catheter</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-mono font-medium">SSI (Colon)</td>
                  <td className="py-2">Surgical Site Infection – Colon</td>
                  <td className="py-2">Infection at incision site after colon surgery</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-mono font-medium">SSI (Abd)</td>
                  <td className="py-2">Surgical Site Infection – Abdominal Hysterectomy</td>
                  <td className="py-2">Infection at incision site after abdominal hysterectomy</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-mono font-medium">MRSA</td>
                  <td className="py-2">Methicillin-Resistant Staphylococcus Aureus</td>
                  <td className="py-2">Antibiotic-resistant staph bloodstream infection</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-mono font-medium">CDI</td>
                  <td className="py-2">Clostridioides difficile Infection</td>
                  <td className="py-2">Bacterial infection causing colon inflammation</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold mt-6 mb-2">Standardized Infection Ratio (SIR)</h3>
          <p>
            Each HAI is reported as a <strong>Standardized Infection Ratio (SIR)</strong> —
            the ratio of observed infections to the number predicted by a statistical model
            based on a national baseline.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li><strong>SIR &lt; 1.0</strong> — Fewer infections than expected (better performance)</li>
            <li><strong>SIR = 1.0</strong> — Same as the national baseline</li>
            <li><strong>SIR &gt; 1.0</strong> — More infections than expected (worse performance)</li>
          </ul>
        </Section>

        {/* HCAHPS */}
        <Section id="hcahps" icon={Star} title="Patient Experience (HCAHPS)">
          <p>
            The <strong>Hospital Consumer Assessment of Healthcare Providers and Systems
            (HCAHPS)</strong> is a standardized survey administered to a random sample of
            recently discharged patients. It measures patient perspectives on hospital care
            across multiple dimensions:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Nurse Communication</li>
            <li>Doctor Communication</li>
            <li>Staff Responsiveness</li>
            <li>Communication About Medicines</li>
            <li>Discharge Information</li>
            <li>Care Transition</li>
            <li>Hospital Cleanliness</li>
            <li>Hospital Quietness</li>
            <li>Overall Hospital Rating (0–10 scale)</li>
            <li>Willingness to Recommend</li>
          </ul>
          <p className="mt-3">
            Each domain receives a <strong>star rating (1–5)</strong> based on patient
            responses. An <strong>Overall HCAHPS Star Rating</strong> is also calculated
            as a composite of all domains.
          </p>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
              What is the Linear Mean Score?
            </summary>
            <div className="mt-2 text-sm space-y-2 pl-4 border-l-2" style={{ borderColor: 'var(--border)' }}>
              <p>
                The <strong>linear mean</strong> is the average of patients&apos; numerical responses
                on the underlying survey scale before conversion to star ratings. For
                &ldquo;top-box&rdquo; questions, it represents the percentage of patients who gave the
                most positive response (e.g., &ldquo;Always&rdquo;). For the overall rating, it&apos;s the
                mean score on a 0–10 scale.
              </p>
            </div>
          </details>
        </Section>

        {/* Clinical Outcomes */}
        <Section id="clinical-outcomes" icon={HeartPulse} title="Clinical Outcomes">
          <p>
            CMS tracks <strong>30-day risk-adjusted mortality rates</strong> for five
            conditions and <strong>complication rates</strong> for one major procedure:
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 font-semibold">Measure ID</th>
                  <th className="text-left py-2 font-semibold">Condition</th>
                  <th className="text-left py-2 font-semibold">What It Measures</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['MORT_30_AMI', 'Heart Attack (AMI)', '% of patients who died within 30 days of admission for heart attack'],
                  ['MORT_30_HF', 'Heart Failure', '% of patients who died within 30 days of admission for heart failure'],
                  ['MORT_30_PN', 'Pneumonia', '% of patients who died within 30 days of admission for pneumonia'],
                  ['MORT_30_COPD', 'COPD', '% of patients who died within 30 days of admission for chronic obstructive pulmonary disease'],
                  ['MORT_30_CABG', 'CABG Surgery', '% of patients who died within 30 days of coronary artery bypass surgery'],
                  ['COMP_HIP_KNEE', 'Hip/Knee Replacement', 'Rate of serious complications within 90 days of elective hip or knee replacement'],
                ].map(([id, cond, desc]) => (
                  <tr key={id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 font-mono font-medium">{id}</td>
                    <td className="py-2">{cond}</td>
                    <td className="py-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold mt-6 mb-2">Risk Adjustment</h3>
          <p>
            Mortality and complication rates are <strong>risk-adjusted</strong> using
            hierarchical logistic regression models. This accounts for age, sex, and
            clinical comorbidities so that hospitals treating sicker patients aren&apos;t
            unfairly penalized.
          </p>

          <h3 className="font-semibold mt-6 mb-2">Benchmark Comparison</h3>
          <p>
            Each hospital&apos;s rate is compared to the national rate using statistical
            significance testing. Results are classified as:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li><span className="text-green-600 font-medium">Better than the National Rate</span> — Statistically significantly lower mortality</li>
            <li><span className="text-yellow-600 font-medium">No Different than the National Rate</span> — Not statistically different</li>
            <li><span className="text-red-600 font-medium">Worse than the National Rate</span> — Statistically significantly higher mortality</li>
          </ul>
        </Section>

        {/* Spending & Efficiency */}
        <Section id="spending-efficiency" icon={DollarSign} title="Spending & Efficiency">
          <p>
            The <strong>Medicare Spending Per Beneficiary (MSPB)</strong> measure evaluates
            hospitals&apos; efficiency by comparing their Medicare spending to the national
            median. MSPB covers <em>all</em> Medicare Part A and Part B claims from 3 days
            before hospital admission through 30 days after discharge.
          </p>

          <h3 className="font-semibold mt-6 mb-2">How MSPB Is Calculated</h3>
          <p>
            A hospital&apos;s MSPB is the ratio of its price-standardized, risk-adjusted spending
            per episode to the national median episode spending. The &ldquo;episode&rdquo; includes the
            initial hospital stay, post-acute care, physician services, and other Part B
            services.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li><strong>MSPB = 1.0</strong> — Spending matches the national median</li>
            <li><strong>MSPB &lt; 1.0</strong> — More efficient; spending is below the national median</li>
            <li><strong>MSPB &gt; 1.0</strong> — Less efficient; spending is above the national median</li>
          </ul>
        </Section>

        {/* HVBP */}
        <Section id="hvbp" icon={Award} title="Value-Based Purchasing (HVBP)">
          <p>
            The <strong>Hospital Value-Based Purchasing (HVBP)</strong> program adjusts
            hospitals&apos; Medicare payments based on quality performance. CMS withholds a
            percentage (currently 2%) of each hospital&apos;s base operating DRG payments and
            redistributes it based on their Total Performance Score.
          </p>

          <h3 className="font-semibold mt-6 mb-2">Total Performance Score (TPS)</h3>
          <p>
            The TPS ranges from 0 to 100 and combines four equally weighted (25% each) domains:
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 font-semibold">Domain</th>
                  <th className="text-left py-2 font-semibold">Weight</th>
                  <th className="text-left py-2 font-semibold">Key Measures</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-medium">Clinical Outcomes</td>
                  <td className="py-2">25%</td>
                  <td className="py-2">30-day mortality rates (AMI, HF, PN, CABG)</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-medium">Safety</td>
                  <td className="py-2">25%</td>
                  <td className="py-2">HAIs (CLABSI, CAUTI, SSI, MRSA, CDI) and PSI-90</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-medium">Person &amp; Community Engagement</td>
                  <td className="py-2">25%</td>
                  <td className="py-2">HCAHPS patient survey scores</td>
                </tr>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2 font-medium">Efficiency &amp; Cost Reduction</td>
                  <td className="py-2">25%</td>
                  <td className="py-2">MSPB ratio</td>
                </tr>
              </tbody>
            </table>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400">
              How does HVBP affect payment?
            </summary>
            <div className="mt-2 text-sm space-y-2 pl-4 border-l-2" style={{ borderColor: 'var(--border)' }}>
              <p>
                CMS withholds 2% of each hospital&apos;s base DRG payments, creating a pool.
                Hospitals with higher TPS scores earn back more than what was withheld (a bonus),
                while those with lower scores receive less (a penalty). The exchange rate between
                TPS points and dollars varies by year.
              </p>
            </div>
          </details>
        </Section>

        {/* HAC Reduction Program */}
        <Section id="hac-program" icon={ShieldCheck} title="HAC Reduction Program">
          <p>
            The <strong>Hospital-Acquired Condition (HAC) Reduction Program</strong>
            penalizes hospitals that rank in the <strong>worst-performing quartile</strong>{' '}
            (bottom 25%) for hospital-acquired conditions. Penalized hospitals receive a
            <strong> 1% reduction</strong> in total Medicare payments for that fiscal year.
          </p>

          <h3 className="font-semibold mt-6 mb-2">HAC Scoring</h3>
          <p>
            The HAC Total Score is a composite of the CMS PSI-90 patient safety indicator
            and the six HAI measures (CLABSI, CAUTI, SSI, MRSA, CDI). Each component is
            scored based on actual performance vs. predicted performance, then combined into
            a total score. Higher scores indicate worse performance.
          </p>
          <p className="mt-2">
            Approximately 750–800 hospitals receive the payment penalty each year.
          </p>
        </Section>

        {/* HRRP */}
        <Section id="hrrp" icon={BarChart3} title="Hospital Readmissions Reduction Program (HRRP)">
          <p>
            The <strong>Hospital Readmissions Reduction Program (HRRP)</strong> reduces
            Medicare payments to hospitals with excess readmissions.
            Readmissions are unplanned returns to any hospital within 30 days of discharge.
          </p>

          <h3 className="font-semibold mt-6 mb-2">Conditions Tracked</h3>
          <p>HRRP monitors excess readmission ratios for six conditions:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li>Acute Myocardial Infarction (Heart Attack)</li>
            <li>Heart Failure</li>
            <li>Pneumonia</li>
            <li>Chronic Obstructive Pulmonary Disease (COPD)</li>
            <li>Elective Hip/Knee Replacement</li>
            <li>Coronary Artery Bypass Graft (CABG)</li>
          </ul>

          <h3 className="font-semibold mt-6 mb-2">Excess Readmission Ratio</h3>
          <p>
            The ratio compares a hospital&apos;s predicted readmission rate to the rate expected
            for an average hospital serving a similar mix of patients. A ratio
            greater than 1.0 means the hospital has more readmissions than expected.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
            <li><strong>Ratio ≤ 1.0</strong> — At or below expected (no penalty for this condition)</li>
            <li><strong>Ratio &gt; 1.0</strong> — Excess readmissions (contributes to payment penalty, up to 3% reduction)</li>
          </ul>
        </Section>

        {/* Glossary */}
        <Section id="glossary" icon={BookOpen} title="Glossary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left py-2 font-semibold w-40">Term</th>
                  <th className="text-left py-2 font-semibold">Definition</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  ['AMI', 'Acute Myocardial Infarction (heart attack)'],
                  ['CABG', 'Coronary Artery Bypass Graft (open-heart surgery)'],
                  ['CAUTI', 'Catheter-Associated Urinary Tract Infection'],
                  ['CDI', 'Clostridioides difficile Infection'],
                  ['CLABSI', 'Central Line-Associated Bloodstream Infection'],
                  ['CMS', 'Centers for Medicare & Medicaid Services'],
                  ['COPD', 'Chronic Obstructive Pulmonary Disease'],
                  ['HAC', 'Hospital-Acquired Condition'],
                  ['HAI', 'Healthcare-Associated Infection'],
                  ['HCAHPS', 'Hospital Consumer Assessment of Healthcare Providers and Systems (patient survey)'],
                  ['HF', 'Heart Failure'],
                  ['HRRP', 'Hospital Readmissions Reduction Program'],
                  ['HVBP', 'Hospital Value-Based Purchasing'],
                  ['MRSA', 'Methicillin-Resistant Staphylococcus Aureus'],
                  ['MSPB', 'Medicare Spending Per Beneficiary'],
                  ['PN', 'Pneumonia'],
                  ['SIR', 'Standardized Infection Ratio'],
                  ['SSI', 'Surgical Site Infection'],
                  ['TPS', 'Total Performance Score (HVBP composite score, 0–100)'],
                ].map(([term, def]) => (
                  <tr key={term} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 font-mono font-medium">{term}</td>
                    <td className="py-2">{def}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Data Sources */}
        <Section id="data-sources" icon={BarChart3} title="Data Sources & Freshness">
          <p>
            All data in this explorer comes from CMS publicly available datasets
            published through <strong>data.cms.gov</strong> and the{' '}
            <strong>CMS Care Compare</strong> program.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4 mt-3">
            <li><strong>Current data vintage:</strong> CMS July 2025 release</li>
            <li><strong>Hospitals covered:</strong> ~5,381 Medicare-certified hospitals</li>
            <li><strong>Measure periods:</strong> Most measures cover 3 years of data (the specific period varies by measure)</li>
            <li><strong>Update frequency:</strong> CMS typically updates data quarterly (January, April, July, October)</li>
          </ul>
          <p className="mt-3">
            Data includes Hospital General Information, Complications and Deaths,
            Healthcare-Associated Infections, HCAHPS survey results, Medicare
            Spending Per Beneficiary, Hospital Value-Based Purchasing scores,
            Hospital Readmissions Reduction Program data, and HAC Reduction
            Program results.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
        {children}
      </div>
    </section>
  );
}
