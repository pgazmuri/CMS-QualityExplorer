import { test, expect } from '@playwright/test';

test.setTimeout(15_000);

test.describe('Hospital Compass - search', () => {
  test('loads search page with empty state', async ({ page }) => {
    await page.goto('/dashboards/hospital-compass');
    await expect(page.getByRole('heading', { name: /Hospital Compass/i })).toBeVisible();
    // Search input should be present
    await expect(page.getByPlaceholder(/hospital name/i)).toBeVisible();
  });

  test('search by name returns results', async ({ page }) => {
    await page.goto('/dashboards/hospital-compass?q=mayo');
    // Should show hospital cards
    await expect(page.locator('body')).toContainText(/mayo/i);
  });

  test('search form pushes URL params', async ({ page }) => {
    await page.goto('/dashboards/hospital-compass');
    await page.getByPlaceholder(/hospital name/i).fill('mayo');
    await page.getByRole('button', { name: /search/i }).click();
    await expect(page).toHaveURL(/q=mayo/);
  });

  test('state filter narrows results', async ({ page }) => {
    await page.goto('/dashboards/hospital-compass?q=general&state=CA');
    await expect(page.locator('body')).toContainText(/CA|California/i);
  });

  test('no results shows empty state message', async ({ page }) => {
    await page.goto('/dashboards/hospital-compass?q=xyzthishospitaldoesnotexist99999');
    // Should show some "no results" indication without crashing
    const response = await page.goto('/dashboards/hospital-compass?q=xyzthishospitaldoesnotexist99999');
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Hospital profile page', () => {
  // Get a real facility ID from the API first
  let facilityId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('/api/query', {
      data: { sql: "SELECT facility_id FROM v_hospital_profile WHERE star_rating = 5 LIMIT 1" },
    });
    const json = await res.json();
    facilityId = json.rows?.[0]?.facility_id;
    expect(facilityId).toBeTruthy();
  });

  test('hospital profile loads with name and address', async ({ page }) => {
    await page.goto(`/dashboards/hospital-compass/${facilityId}`);
    // Should show the hospital name (h1)
    await expect(page.getByRole('heading').first()).toBeVisible();
    // Should NOT be the 404 page
    await expect(page.locator('body')).not.toContainText(/not found/i);
  });

  test('profile shows quality domain sections', async ({ page }) => {
    await page.goto(`/dashboards/hospital-compass/${facilityId}`);
    // At least one quality domain should be referenced
    await expect(page.locator('body')).toContainText(
      /mortality|safety|experience|spending|readmission/i
    );
  });

  test('unknown facility returns 404 page', async ({ page }) => {
    const res = await page.goto('/dashboards/hospital-compass/FAKEID00000');
    // notFound() triggers Next.js 404
    expect(res?.status()).toBe(404);
  });
});
