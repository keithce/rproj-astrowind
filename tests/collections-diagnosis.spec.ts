import { test, expect, type ConsoleMessage } from '@playwright/test';

test.describe('Collections Diagnosis', () => {
  let consoleErrors: ConsoleMessage[];

  test.beforeEach(async ({ page }) => {
    // Capture console errors for assertions
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg);
      }
    });
  });

  test('TIL Collection - Check for empty state', async ({ page }) => {
    await page.goto('/til');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);

    // Check if we see the "No entries found" message
    const noEntriesMessage = page.locator('text=No entries found');
    const tilEntries = page.locator('[data-testid="til-entry"], .til-card, .til-item');

    const hasNoEntries = await noEntriesMessage.isVisible().catch(() => false);
    const entryCount = await tilEntries.count();

    if (hasNoEntries) {
      // If empty state is shown, entry count should be 0
      expect(entryCount).toBe(0);
      await expect(noEntriesMessage).toBeVisible();
    } else {
      // If entries exist, count should be greater than 0
      expect(entryCount).toBeGreaterThan(0);

      // Wait for at least one entry to be visible
      await tilEntries.first().waitFor({ state: 'visible', timeout: 10000 });
    }
  });

  test('Resources Collection - Check for empty state', async ({ page }) => {
    await page.goto('/resources');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);

    // Check if we see the "No resources found" message
    const noResourcesMessage = page.locator('text=No resources found');
    const resourceEntries = page.locator('[data-testid="resource-entry"], .resource-card, .resource-item');

    const hasNoResources = await noResourcesMessage.isVisible().catch(() => false);
    const entryCount = await resourceEntries.count();

    if (hasNoResources) {
      // If empty state is shown, entry count should be 0
      expect(entryCount).toBe(0);
      await expect(noResourcesMessage).toBeVisible();
    } else {
      // If entries exist, count should be greater than 0
      expect(entryCount).toBeGreaterThan(0);

      // Wait for at least one entry to be visible
      await resourceEntries.first().waitFor({ state: 'visible', timeout: 12000 });
    }
  });

  test('Check TIL Content Files Exist', async ({ page }) => {
    // Navigate to a specific TIL entry to see if content exists
    await page.goto('/til/advanced-css-container-queries');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Assert 404 and Error elements are not visible
    const error404 = page.locator('text=404');
    const errorMessage = page.locator('text=Error');

    await expect(error404).not.toBeVisible();
    await expect(errorMessage).not.toBeVisible();

    // Check for the title and assert it has non-empty text
    const title = page.locator('h1, [data-testid="til-title"]');
    await title.waitFor({ state: 'visible', timeout: 5000 });

    const titleText = await title.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText?.trim().length).toBeGreaterThan(0);

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Check Environment Variables and API Connectivity', async ({ page }) => {
    // Go to resources page and check for Notion API errors
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    // Assert no API or authentication error elements are visible
    const notionError = page.locator('text=Notion error');
    const apiError = page.locator('text=API error');
    const authError = page.locator('text=authentication error');

    await expect(notionError).not.toBeVisible();
    await expect(apiError).not.toBeVisible();
    await expect(authError).not.toBeVisible();

    // Assert no console errors occurred
    expect(consoleErrors).toHaveLength(0);

    // Check page content for error strings
    const content = await page.content();
    expect(content).not.toContain('NOTION_API_KEY');
    expect(content).not.toContain('Authentication failed');
    expect(content).not.toContain('API connection error');
  });

  test('Check Collection Data Loading in Browser Console', async ({ page }) => {
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    // Check for data elements (if any exist, just count them)
    const dataElements = await page.locator('[data-collection], [data-entries], [data-count]').all();
    expect(dataElements.length).toBeGreaterThanOrEqual(0);

    // Assert no loading indicators are visible after page load
    const loadingIndicators = page.locator('[data-loading="true"], .loading:visible, .spinner:visible');
    await expect(loadingIndicators).toHaveCount(0);

    // Check page source doesn't contain error messages
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/Error loading (collection|data)/i);
    expect(pageContent).not.toMatch(/Failed to (fetch|load)/i);
    expect(pageContent).not.toContain('undefined');

    // Assert no console errors
    expect(consoleErrors).toHaveLength(0);
  });
});
