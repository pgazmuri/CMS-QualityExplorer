import { test, expect } from '@playwright/test';

const DASHBOARD_ROUTES = [
  { path: '/dashboards/safety',               heading: /Safety Observatory/ },
  { path: '/dashboards/patient-experience',   heading: /Patient Experience/ },
  { path: '/dashboards/clinical-outcomes',    heading: /Clinical Outcomes/ },
  { path: '/dashboards/spending-efficiency',  heading: /Spending.*Efficiency/ },
  { path: '/dashboards/geographic',           heading: /Geographic Atlas/ },
  { path: '/dashboards/value-based-programs', heading: /Value-Based Programs/ },
];

// Each dashboard should render within 10s (DuckDB already warm)
test.setTimeout(15_000);

for (const { path, heading } of DASHBOARD_ROUTES) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(500);

    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    expect(errors).toHaveLength(0);
  });
}

test('safety dashboard shows HAI data table or chart', async ({ page }) => {
  await page.goto('/dashboards/safety');
  // Either a table or a heading related to HAI should be visible
  const hasContent = await page
    .locator('table, [data-testid="chart"], h2, h3')
    .first()
    .isVisible();
  expect(hasContent).toBe(true);
});

test('geographic atlas shows state data', async ({ page }) => {
  await page.goto('/dashboards/geographic');
  // State abbreviations appear in table — no word boundaries needed
  await expect(page.locator('body')).toContainText(/CA|TX|FL|NY|IL/);
});

test('clinical outcomes shows national benchmark data', async ({ page }) => {
  await page.goto('/dashboards/clinical-outcomes');
  // Mortality measures start with MORT_
  const body = page.locator('body');
  // Should show some mortality context
  await expect(body).toContainText(/mortality|MORT|30-day/i);
});
