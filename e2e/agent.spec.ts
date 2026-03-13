import { test, expect } from '@playwright/test';

test.describe('Agent page', () => {
  test('renders two-panel layout', async ({ page }) => {
    await page.goto('/agent');
    // Chat panel should have a textarea
    await expect(page.locator('textarea')).toBeVisible();
    // Submit button (icon only, no text label)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows empty workspace message when no widgets', async ({ page }) => {
    await page.goto('/agent');
    // Widget grid should show an empty state
    await expect(page.locator('body')).toContainText(/analysis workspace|ask a question|no widgets/i);
  });

  test('shows placeholder message in chat', async ({ page }) => {
    await page.goto('/agent');
    await expect(
      page.locator('textarea[placeholder]')
    ).toHaveAttribute('placeholder', /hospital|quality|metric/i);
  });

  test('send button disabled when input is empty', async ({ page }) => {
    await page.goto('/agent');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('send button enabled after typing', async ({ page }) => {
    await page.goto('/agent');
    await page.locator('textarea').fill('Show me hospitals in California');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('user message appears in chat after submit', async ({ page }) => {
    await page.goto('/agent');
    await page.locator('textarea').fill('Hello test message');
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toContainText('Hello test message');
  });
});
