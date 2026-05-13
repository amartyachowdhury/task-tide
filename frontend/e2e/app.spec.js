const { test, expect } = require('@playwright/test');

test.describe('Task-Tide UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/public/index.html');
  });

  test('shows app title and task form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Task-Tide' })).toBeVisible();
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
  });

  test('shows Live sync when API is reachable', async ({ page }) => {
    await expect(page.locator('#connection-status')).toContainText('Live sync', { timeout: 15_000 });
  });

  test('creates a task via API and filters by status', async ({ page }) => {
    await expect(page.locator('#connection-status')).toContainText('Live sync', { timeout: 15_000 });

    const unique = `E2E ${Date.now()}`;
    await page.getByPlaceholder('What needs to be done?').fill(unique);
    await page.getByRole('button', { name: /Add Task/i }).click();

    await expect(page.locator('.task-list .task-title', { hasText: unique })).toBeVisible({
      timeout: 10_000
    });

    await page.locator('#status-filter').selectOption('completed');
    await expect(page.locator('.task-list .task-title', { hasText: unique })).toHaveCount(0);

    await page.locator('#status-filter').selectOption('active');
    await expect(page.locator('.task-list .task-title', { hasText: unique })).toBeVisible();
  });
});
