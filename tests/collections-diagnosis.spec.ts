import { test } from '@playwright/test';

test.describe('Collections Diagnosis', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to capture any errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });

    // Enable network request logging
    page.on('request', request => {
      if (request.url().includes('notion') || request.url().includes('api')) {
        console.log('API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('notion') || response.url().includes('api')) {
        console.log('API Response:', response.status(), response.url());
      }
    });
  });

  test('TIL Collection - Check for empty state', async ({ page }) => {
    console.log('🔍 Testing TIL Collection...');

    await page.goto('/til');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check if we see the "No entries found" message
    const noEntriesMessage = page.locator('text=No entries found');
    const hasNoEntries = await noEntriesMessage.isVisible();

    if (hasNoEntries) {
      console.log('❌ TIL Collection is empty - showing "No entries found" message');

      // Check if there are any TIL entries in the content directory
      const tilEntries = page.locator('[data-testid="til-entry"], .til-card, .til-item');
      const entryCount = await tilEntries.count();
      console.log(`📊 TIL entries found on page: ${entryCount}`);

      // Wait deterministically for either entries to appear or the empty state to be visible
      console.log('🔍 Waiting for TIL entries or empty state...');
      await Promise.race([
        page.waitForSelector('[data-testid="til-entry"], .til-card, .til-item', { state: 'visible', timeout: 10000 }),
        page.waitForSelector('text=No entries found', { state: 'visible', timeout: 10000 }),
        page.waitForResponse(r => /notion|api/i.test(r.url()) && r.ok(), { timeout: 10000 }),
      ]);
    } else {
      console.log('✅ TIL Collection has entries');

      // Count the actual entries
      const tilEntries = page.locator('[data-testid="til-entry"], .til-card, .til-item');
      const entryCount = await tilEntries.count();
      console.log(`📊 TIL entries found: ${entryCount}`);
    }
  });

  test('Resources Collection - Check for empty state', async ({ page }) => {
    console.log('🔍 Testing Resources Collection...');

    await page.goto('/resources');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check if we see the "No resources found" message
    const noResourcesMessage = page.locator('text=No resources found');
    const hasNoResources = await noResourcesMessage.isVisible();

    if (hasNoResources) {
      console.log('❌ Resources Collection is empty - showing "No resources found" message');

      // Check if there are any resource entries
      const resourceEntries = page.locator('[data-testid="resource-entry"], .resource-card, .resource-item');
      const entryCount = await resourceEntries.count();
      console.log(`📊 Resource entries found on page: ${entryCount}`);

      // Wait deterministically for either entries to appear or the empty state to be visible
      console.log('🔍 Waiting for Resource entries or empty state...');
      await Promise.race([
        page.waitForSelector('[data-testid="resource-entry"], .resource-card, .resource-item', {
          state: 'visible',
          timeout: 12000,
        }),
        page.waitForSelector('text=No resources found', { state: 'visible', timeout: 12000 }),
        page.waitForResponse(r => /notion|api/i.test(r.url()) && r.ok(), { timeout: 12000 }),
      ]);
    } else {
      console.log('✅ Resources Collection has entries');

      // Count the actual entries
      const resourceEntries = page.locator('[data-testid="resource-entry"], .resource-card, .resource-item');
      const entryCount = await resourceEntries.count();
      console.log(`📊 Resource entries found: ${entryCount}`);
    }
  });

  test('Check TIL Content Files Exist', async ({ page }) => {
    console.log('🔍 Checking TIL content files...');

    // Navigate to a specific TIL entry to see if content exists
    await page.goto('/til/advanced-css-container-queries');

    // Check if the page loads successfully
    const is404 = await page.locator('text=404').isVisible();
    const isError = await page.locator('text=Error').isVisible();

    if (is404 || isError) {
      console.log('❌ TIL content file not found or has errors');
    } else {
      console.log('✅ TIL content file exists and loads');

      // Check for the title
      const title = page.locator('h1, [data-testid="til-title"]');
      const titleText = await title.textContent();
      console.log(`📄 TIL Title: ${titleText}`);
    }
  });

  test('Check Environment Variables and API Connectivity', async ({ page }) => {
    console.log('🔍 Checking environment and API connectivity...');

    // Go to resources page and check for Notion API errors
    await page.goto('/resources');
    await page.waitForLoadState('networkidle');

    // Check for specific error messages
    const notionError = page.locator('text=Notion');
    const apiError = page.locator('text=API');
    const authError = page.locator('text=authentication');

    const hasNotionError = await notionError.isVisible();
    const hasApiError = await apiError.isVisible();
    const hasAuthError = await authError.isVisible();

    if (hasNotionError || hasApiError || hasAuthError) {
      console.log('❌ API or authentication errors detected');
    } else {
      console.log('✅ No obvious API errors detected');
    }

    // Instead of duplicating console listeners, deterministically check page content for error signals
    await Promise.race([
      page.waitForSelector('text=Notion', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('text=API', { timeout: 5000 }).catch(() => null),
      page.waitForSelector('text=authentication', { timeout: 5000 }).catch(() => null),
      page.waitForLoadState('networkidle'),
    ]);

    const content = await page.content();
    const hasConsoleLikeErrors = /error|Error|NOTION|API|auth/i.test(content);

    if (hasConsoleLikeErrors) {
      console.log('❌ Signals of API/auth issues detected in page content');
    } else {
      console.log('✅ No API/auth related signals detected in page content');
    }
  });

  test('Check Collection Data Loading in Browser Console', async ({ page }) => {
    console.log('🔍 Checking collection data loading...');

    // Inject a script to check what data is being loaded
    await page.goto('/til');
    await page.waitForLoadState('networkidle');

    // Check if there are any data attributes or scripts that show collection state
    const dataElements = await page.locator('[data-collection], [data-entries], [data-count]').all();
    console.log(`📊 Data elements found: ${dataElements.length}`);

    // Check for any loading indicators
    const loadingIndicators = await page.locator('[data-loading], .loading, .spinner').all();
    console.log(`⏳ Loading indicators found: ${loadingIndicators.length}`);

    // Check page source for any error messages
    const pageContent = await page.content();
    const hasErrorInSource = pageContent.includes('Error') || pageContent.includes('error');
    console.log(`🔍 Error in page source: ${hasErrorInSource}`);
  });
});
