import { test, expect } from '@playwright/test';

test.describe('Data Loading', () => {
  test('TIL Data Loading', async ({ page }) => {
    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to TIL page
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    // Start network response wait concurrently (non-blocking)
    const responsePromise = page
      .waitForResponse(r => /notion|api/i.test(r.url()) && r.ok(), { timeout: 10000 })
      .catch(() => null);

    // Always wait for DOM indicator to be visible first
    await page.waitForSelector('.til-card, [data-til], .til-item, text=No entries found', {
      state: 'visible',
      timeout: 10000,
    });

    // Optionally await response (non-blocking for test flow)
    responsePromise.catch(() => {});

    // Assert no console errors
    const errors = consoleLogs.filter(log => log.startsWith('[error]'));
    expect(errors, 'Should not have console errors').toHaveLength(0);

    // Assert TIL cards are present or empty state is shown
    const tilCards = await page.locator('.til-card, [data-til], .til-item').count();
    const emptyState = await page.locator('text=No entries found').isVisible();

    expect(tilCards > 0 || emptyState, 'Should have TIL cards or show empty state').toBeTruthy();

    // Assert no error messages are displayed
    const errorLocator = page.locator('text=Error').or(page.locator('text=error')).or(page.locator('text=Failed'));
    const errorMessages = await errorLocator.count();
    expect(errorMessages, 'Should not display error messages').toBe(0);
  });

  test('Resources Data Loading', async ({ page }) => {
    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to Resources page
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    // Start network response wait concurrently (non-blocking)
    const responsePromise = page
      .waitForResponse(r => /notion|api/i.test(r.url()) && r.ok(), { timeout: 12000 })
      .catch(() => null);

    // Always wait for DOM indicator to be visible first
    await page.waitForSelector('.resource-card, [data-resource], .resource-item, text=No resources found', {
      state: 'visible',
      timeout: 12000,
    });

    // Optionally await response (non-blocking for test flow)
    responsePromise.catch(() => {});

    // Assert no console errors
    const errors = consoleLogs.filter(log => log.startsWith('[error]'));
    expect(errors, 'Should not have console errors').toHaveLength(0);

    // Assert resource cards are present or empty state is shown
    const resourceCards = await page.locator('.resource-card, [data-resource], .resource-item').count();
    const emptyState = await page.locator('text=No resources found').isVisible();

    expect(resourceCards > 0 || emptyState, 'Should have resource cards or show empty state').toBeTruthy();

    // Assert no error messages are displayed
    const errorLocator = page.locator('text=Error').or(page.locator('text=error')).or(page.locator('text=Failed'));
    const errorMessages = await errorLocator.count();
    expect(errorMessages, 'Should not display error messages').toBe(0);
  });

  test('Network Requests Should Succeed', async ({ page }) => {
    const responses: { status: number; url: string }[] = [];

    page.on('response', response => {
      responses.push({
        status: response.status(),
        url: response.url(),
      });
    });

    // Navigate to both pages
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    // Assert no failed requests (status >= 400)
    const failedRequests = responses.filter(res => res.status >= 400);

    expect(
      failedRequests,
      `Should not have failed requests. Failed: ${failedRequests.map(r => `${r.status} ${r.url}`).join(', ')}`
    ).toHaveLength(0);

    // Assert we received responses (network activity occurred)
    expect(responses.length, 'Should have received network responses').toBeGreaterThan(0);
  });

  test('Page Source Contains Expected Data', async ({ page }) => {
    // Check TIL page
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    const tilContent = await page.content();
    const tilHasData = tilContent.includes('til') || tilContent.includes('TIL');
    expect(tilHasData, 'TIL page should contain TIL-related content').toBeTruthy();

    // Check Resources page
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    const resourcesContent = await page.content();
    const resourcesHasData = resourcesContent.includes('resource') || resourcesContent.includes('Resource');
    expect(resourcesHasData, 'Resources page should contain resource-related content').toBeTruthy();

    // Assert no Notion or API errors in page source
    const hasNotionError = resourcesContent.includes('Notion') && resourcesContent.includes('Error');
    const hasApiError = resourcesContent.includes('API') && resourcesContent.includes('Error');

    expect(hasNotionError, 'Should not have Notion errors in page source').toBeFalsy();
    expect(hasApiError, 'Should not have API errors in page source').toBeFalsy();
  });
});
