import type { Metadata } from 'next';
import { SideNav } from '@/components/layout/SideNav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CMS Quality Explorer',
    template: '%s | CMS Quality Explorer',
  },
  description: 'Explore CMS hospital quality data — safety, outcomes, patient experience, and spending',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="flex h-screen overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-y-auto bg-[var(--background)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
