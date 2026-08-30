---
title: 'Automating Accessibility Testing in CI/CD'
date: 2025-06-27
tags: ['accessibility', 'a11y', 'testing', 'github-actions', 'ci-cd']
description: 'Today I learned how to set up automated accessibility testing in GitHub Actions to catch issues before they reach production.'
draft: false
---

# Automating Accessibility Testing in CI/CD

Accessibility shouldn't be an afterthought. Today I added automated a11y testing to the CI pipeline so issues are caught before merge.

## The Tools

- **axe-core**: Industry-standard accessibility testing engine
- **Playwright**: Browser automation for real page testing
- **GitHub Actions**: CI/CD orchestration

## The Workflow

```yaml
# .github/workflows/accessibility-testing.yml
name: Accessibility Testing

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install
      - run: pnpm build
      - run: pnpm preview &
      - name: Run accessibility tests
        run: npx playwright test accessibility.spec.ts
```

## The Test

```typescript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## What It Catches

- Missing alt text
- Color contrast issues
- Missing form labels
- Improper heading hierarchy
- Keyboard navigation problems

## Key Insight

Running these tests on every PR creates accountability. When a violation fails the build, it can't be ignored. Accessibility becomes part of the definition of "done" rather than a nice-to-have.
