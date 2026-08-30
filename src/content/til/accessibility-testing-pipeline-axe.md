---
title: 'Building an Accessibility Testing Pipeline with Axe-Core'
date: 2025-06-27
tags: ['accessibility', 'testing', 'ci', 'wcag']
description: 'Today I learned how to set up automated accessibility testing with axe-core and Lighthouse in a CI/CD pipeline.'
draft: false
---

# Building an Accessibility Testing Pipeline with Axe-Core

Manual accessibility audits don't scale. Automated testing catches regressions before they reach production.

## The Testing Stack

- **axe-core**: Automated WCAG violation detection
- **Lighthouse**: Performance and a11y scores
- **Puppeteer**: Headless browser automation

## Configuration

```javascript
// accessibility.config.js
export default {
  axe: {
    rules: {
      'color-contrast': { enabled: true },
      'valid-lang': { enabled: true },
      'landmark-one-main': { enabled: true },
    },
    exclude: [
      '[data-a11y-ignore]', // Escape hatch for known issues
    ],
  },
  lighthouse: {
    categories: ['accessibility'],
    thresholds: {
      accessibility: 90,
    },
  },
  urls: ['/', '/about', '/contact', '/services/rhythm'],
};
```

## The Test Script

```javascript
// scripts/accessibility-test.js
import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';

async function runA11yTests(urls) {
  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  for (const url of urls) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:4321${url}`);

    const axeResults = await new AxePuppeteer(page).analyze();

    results.push({
      url,
      violations: axeResults.violations,
      passes: axeResults.passes.length,
    });
  }

  await browser.close();
  return results;
}
```

## GitHub Actions Workflow

```yaml
accessibility-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - run: npm install
    - run: npm run build
    - run: npm run preview &
    - run: sleep 5
    - run: npm run axe:scan
    - uses: actions/upload-artifact@v6
      with:
        name: accessibility-report
        path: axe-results.json
```

## Key Insight

Automated a11y testing isn't comprehensive—it catches about 30% of issues. But that 30% includes the most common violations: missing alt text, poor contrast, invalid ARIA. Catching these automatically frees up manual testing for complex interactions.
