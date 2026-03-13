import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads and shows hero text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'CMS Quality Explorer' })).toBeVisible();
    await expect(page.getByText(/5,381 U\.S\. hospitals/)).toBeVisible();
  });

  test('shows all 7 dashboard cards', async ({ page }) => {
    await page.goto('/');
    const titles = [
      'Hospital Compass',
      'Safety Observatory',
      'Patient Experience',
      'Clinical Outcomes',
      'Spending & Efficiency',
      'Geographic Atlas',
      'Value-Based Programs',
    ];
    for (const title of titles) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    }
  });

  test('shows AI Data Agent CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'AI Data Agent' })).toBeVisible();
  });

  test('dashboard cards link to correct routes', async ({ page }) => {
    await page.goto('/');
    const cardMap: Record<string, string> = {
      'Hospital Compass':      '/dashboards/hospital-compass',
      'Safety Observatory':    '/dashboards/safety',
      'Patient Experience':    '/dashboards/patient-experience',
      'Clinical Outcomes':     '/dashboards/clinical-outcomes',
      'Spending & Efficiency': '/dashboards/spending-efficiency',
      'Geographic Atlas':      '/dashboards/geographic',
      'Value-Based Programs':  '/dashboards/value-based-programs',
    };
    for (const [name, href] of Object.entries(cardMap)) {
      const link = page.getByRole('link', { name: new RegExp(name) }).first();
      await expect(link).toHaveAttribute('href', href);
    }
  });

  test('SideNav is visible with navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Hospital Compass/ }).first()).toBeVisible();
  });
});
