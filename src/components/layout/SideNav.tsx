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
      style={{ borderColor: 'var(--sidebar-border)', background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <Activity className="h-5 w-5 text-blue-400" />
        <div>
          <p className="text-sm font-semibold leading-none" style={{ color: 'var(--sidebar-fg)' }}>CMS Quality</p>
          <p className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>Explorer</p>
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
                  ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]'
                  : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-active-bg)] hover:text-[var(--sidebar-fg)]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-muted)' }}>
        <p>Data: <a href="https://data.cms.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--sidebar-fg)]">CMS.gov</a> July 2025</p>
        <p>~5,381 hospitals</p>
        <p className="mt-2">&copy; 2026 Pablo Gazmuri</p>
      </div>
    </aside>
  );
}
