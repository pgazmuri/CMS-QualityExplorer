import Link from 'next/link';
import {
  Hospital, ShieldCheck, Star, HeartPulse,
  DollarSign, Map, Award, Bot,
} from 'lucide-react';

const DASHBOARDS = [
  {
    href: '/dashboards/hospital-compass',
    title: 'Hospital Compass',
    description: 'Search any U.S. hospital and view its full quality profile across all CMS domains.',
    icon: Hospital,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    href: '/dashboards/safety',
    title: 'Safety Observatory',
    description: 'Healthcare-associated infections (HAI SIRs), HAC program scores, and patient safety indicators.',
    icon: ShieldCheck,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
  {
    href: '/dashboards/patient-experience',
    title: 'Patient Experience',
    description: 'HCAHPS survey star ratings across nurse communication, responsiveness, discharge, and 8 other domains.',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
  {
    href: '/dashboards/clinical-outcomes',
    title: 'Clinical Outcomes',
    description: '30-day mortality rates for AMI, HF, PN, COPD, CABG and hip/knee complications vs. national benchmarks.',
    icon: HeartPulse,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    href: '/dashboards/spending-efficiency',
    title: 'Spending & Efficiency',
    description: 'Medicare Spending Per Beneficiary ratios and claim-type breakdowns compared to state and national averages.',
    icon: DollarSign,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    href: '/dashboards/geographic',
    title: 'Geographic Atlas',
    description: 'State-level rankings on star ratings, spending, HAC penalties, and readmission rates.',
    icon: Map,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  {
    href: '/dashboards/value-based-programs',
    title: 'Value-Based Programs',
    description: 'HVBP total performance scores and domain breakdown, HAC reduction penalties, and HRRP readmission ratios.',
    icon: Award,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">CMS Quality Explorer</h1>
        <p className="text-lg" style={{ color: 'var(--muted-foreground)' }}>
          Explore hospital quality data from 5,381 U.S. hospitals across safety, outcomes,
          patient experience, spending, and value-based programs.
        </p>
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {DASHBOARDS.map(({ href, title, description, icon: Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-xl border p-5 hover:shadow-md transition-all"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h2 className="font-semibold text-base mb-1 group-hover:text-blue-600 transition-colors">{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
          </Link>
        ))}
      </div>

      {/* Agent CTA */}
      <Link
        href="/agent"
        className="flex items-center gap-4 rounded-xl border p-5 hover:shadow-md transition-all"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 shrink-0">
          <Bot className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h2 className="font-semibold text-base mb-0.5">AI Data Agent</h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Ask natural-language questions. The agent queries DuckDB and builds interactive charts and tables in real time.
          </p>
        </div>
      </Link>
    </div>
  );
}
