import { test } from '@playwright/test';

test.describe('Data Loading Debug', () => {
  test('Debug TIL Data Loading', async ({ page }) => {
    console.log('🔍 Starting TIL data loading debug...');

    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to TIL page
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);

    // Filter TIL-related logs
    const tilLogs = consoleLogs.filter(log => log.includes('[TIL]') || log.includes('TIL') || log.includes('til'));

    console.log('📋 TIL-related console logs:');
    tilLogs.forEach(log => console.log(`  ${log}`));

    // Check if we can find any TIL entries in the DOM
    const tilCards = await page.locator('.til-card, [data-til], .til-item').count();
    console.log(`📊 TIL cards found in DOM: ${tilCards}`);

    // Check for the empty state message
    const emptyState = await page.locator('text=No entries found').isVisible();
    console.log(`📭 Empty state visible: ${emptyState}`);

    // Check for any error messages
    const errorMessages = await page.locator('text=Error, text=error, text=Failed').count();
    console.log(`❌ Error messages found: ${errorMessages}`);
  });

  test('Debug Resources Data Loading', async ({ page }) => {
    console.log('🔍 Starting Resources data loading debug...');

    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Navigate to Resources page
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    // Wait longer for Notion API calls
    await page.waitForTimeout(5000);

    // Filter Resources-related logs
    const resourceLogs = consoleLogs.filter(
      log =>
        log.includes('[RESOURCES]') ||
        log.includes('RESOURCES') ||
        log.includes('resources') ||
        log.includes('Notion') ||
        log.includes('notion')
    );

    console.log('📋 Resources-related console logs:');
    resourceLogs.forEach(log => console.log(`  ${log}`));

    // Check if we can find any resource entries in the DOM
    const resourceCards = await page.locator('.resource-card, [data-resource], .resource-item').count();
    console.log(`📊 Resource cards found in DOM: ${resourceCards}`);

    // Check for the empty state message
    const emptyState = await page.locator('text=No resources found').isVisible();
    console.log(`📭 Empty state visible: ${emptyState}`);

    // Check for any error messages
    const errorMessages = await page.locator('text=Error, text=error, text=Failed').count();
    console.log(`❌ Error messages found: ${errorMessages}`);
  });

  test('Check Network Requests', async ({ page }) => {
    console.log('🔍 Checking network requests...');

    const requests: string[] = [];
    const responses: string[] = [];

    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      responses.push(`${response.status()} ${response.url()}`);
    });

    // Navigate to both pages
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    // Wait for any pending requests
    await page.waitForTimeout(3000);

    console.log('📡 Network requests made:');
    requests.forEach(req => console.log(`  ${req}`));

    console.log('📡 Network responses received:');
    responses.forEach(res => console.log(`  ${res}`));

    // Check for any failed requests
    const failedRequests = responses.filter(res => res.startsWith('4') || res.startsWith('5'));
    if (failedRequests.length > 0) {
      console.log('❌ Failed requests:');
      failedRequests.forEach(req => console.log(`  ${req}`));
    }
  });

  test('Check Page Source for Data', async ({ page }) => {
    console.log('🔍 Checking page source for data...');

    // Check TIL page
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    const tilContent = await page.content();
    const tilHasData = tilContent.includes('til') || tilContent.includes('TIL');
    console.log(`📄 TIL page has TIL-related content: ${tilHasData}`);

    // Check Resources page
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    const resourcesContent = await page.content();
    const resourcesHasData = resourcesContent.includes('resource') || resourcesContent.includes('Resource');
    console.log(`📄 Resources page has resource-related content: ${resourcesHasData}`);

    // Check for specific error patterns
    const hasNotionError = resourcesContent.includes('Notion') && resourcesContent.includes('Error');
    const hasApiError = resourcesContent.includes('API') && resourcesContent.includes('Error');

    console.log(`❌ Notion error in source: ${hasNotionError}`);
    console.log(`❌ API error in source: ${hasApiError}`);
  });
});
