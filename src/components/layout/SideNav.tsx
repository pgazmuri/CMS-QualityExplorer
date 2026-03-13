'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Hospital,
  ShieldCheck,
  Star,
  HeartPulse,
  DollarSign,
  Map,
  Award,
  Bot,
  Home,
  Activity,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/',                                   label: 'Overview',              icon: Home },
  { href: '/dashboards/hospital-compass',         label: 'Hospital Compass',      icon: Hospital },
  { href: '/dashboards/safety',                   label: 'Safety Observatory',    icon: ShieldCheck },
  { href: '/dashboards/patient-experience',       label: 'Patient Experience',    icon: Star },
  { href: '/dashboards/clinical-outcomes',        label: 'Clinical Outcomes',     icon: HeartPulse },
  { href: '/dashboards/spending-efficiency',      label: 'Spending & Efficiency', icon: DollarSign },
  { href: '/dashboards/geographic',               label: 'Geographic Atlas',      icon: Map },
  { href: '/dashboards/value-based-programs',     label: 'Value-Based Programs',  icon: Award },
  { href: '/agent',                               label: 'AI Data Agent',         icon: Bot },
  { href: '/about',                               label: 'About',                 icon: BookOpen },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-[240px] min-w-[240px] h-full border-r overflow-y-auto"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <Activity className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-semibold leading-none">CMS Quality</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Explorer</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
        <p>Data: CMS July 2025</p>
        <p>~5,381 hospitals</p>
      </div>
    </aside>
  );
}
