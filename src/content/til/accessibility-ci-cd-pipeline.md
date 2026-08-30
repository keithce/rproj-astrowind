---
title: 'Automated Accessibility Testing in CI/CD'
date: 2025-01-04
tags: ['accessibility', 'ci-cd', 'github-actions', 'testing']
description: 'Today I learned how to build a comprehensive accessibility testing pipeline with axe-core, Lighthouse, and regression detection in GitHub Actions.'
draft: false
---

# Automated Accessibility Testing in CI/CD

Manual accessibility testing catches issues, but automation catches regressions. I built a GitHub Actions workflow that runs multiple accessibility tools on every push.

## The Testing Stack

Three complementary tools provide coverage:

```yaml
strategy:
  matrix:
    test-type: [axe-core, lighthouse, custom]
```

- **axe-core**: Detailed issue detection with severity levels
- **Lighthouse**: Overall accessibility score with specific recommendations
- **Custom tests**: Project-specific focus and keyboard navigation checks

## Waiting for Dev Server

The workflow needs the Astro dev server running. A robust wait loop:

```yaml
- name: Start astro dev
  run: |
    pnpm astro dev --port 4321 --host &
    echo "PID=$!" >> "$GITHUB_OUTPUT"
    for i in {1..30}; do
      sleep 2
      if curl -sf http://localhost:4321 > /dev/null; then
        echo "✅ Server is up!"; break
      fi
      if [ $i -eq 30 ]; then
        echo "❌ Server did not start" >&2
        exit 1
      fi
    done
```

## Regression Detection

Compare current branch to base branch for PR checks:

```yaml
accessibility-regression:
  if: github.event_name == 'pull_request'
  steps:
    - name: Test current branch
      run: pnpm test:accessibility:ci && cp -r reports current/

    - name: Checkout base branch
      uses: actions/checkout@v6
      with:
        ref: ${{ github.base_ref }}

    - name: Test base branch
      run: pnpm test:accessibility:ci && cp -r reports base/

    - name: Compare results
      run: diff current/summary.json base/summary.json
```

## PR Comments with Results

Automatically comment test results on PRs:

```yaml
- uses: actions/github-script@v8
  with:
    script: |
      const results = require('./accessibility-reports/summary.json');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `## 🛡️ Accessibility Results\n\nScore: ${results.score}/100`,
      });
```

## Mobile Testing

Test accessibility on mobile viewports specifically:

```yaml
- name: Mobile accessibility test
  run: |
    npx lighthouse http://localhost:4321 \
      --only-categories=accessibility \
      --form-factor=mobile \
      --screenEmulation.width=375 \
      --screenEmulation.height=667 \
      --output=json
```

## Key Insight

The multi-tool approach catches different issue types. axe-core finds ARIA problems and color contrast issues. Lighthouse provides an overall score for tracking trends. Custom tests catch project-specific patterns like focus management. Run all three—they complement rather than duplicate each other.
