---
title: 'WCAG Accessibility: From 68% to 90% Compliance'
date: 2025-06-22
tags: ['accessibility', 'wcag', 'css', 'ux']
description: 'Today I learned that accessibility compliance is achievable with systematic auditing and that most fixes are surprisingly simple.'
draft: false
---

# WCAG Accessibility: From 68% to 90% Compliance

Running a comprehensive WCAG 2.1 AA audit on my app was humbling. Starting at 68% compliance felt discouraging, but most fixes were straightforward.

## The Audit Process

I used a combination of tools:

```bash
# Automated scanning
npx @axe-core/cli https://localhost:3000
npx lighthouse https://localhost:3000 --only-categories=accessibility

# Manual testing checklist
# - Keyboard navigation
# - Screen reader testing (VoiceOver/NVDA)
# - Color contrast verification
# - Focus indicators
```

## Most Common Issues

### 1. Color Contrast (40% of issues)

```css
/* Before: Contrast ratio 3.2:1 (fails AA) */
.muted-text {
  color: #999999;
}

/* After: Contrast ratio 4.7:1 (passes AA) */
.muted-text {
  color: #757575;
}
```

Use tools like WebAIM's contrast checker or the browser DevTools.

### 2. Missing Focus Indicators

```css
/* Don't just remove outlines! */
button:focus {
  outline: none; /* Bad! */
}

/* Provide visible focus states */
button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

### 3. Form Labels

```html
<!-- Before: No programmatic association -->
<span>Email</span>
<input type="email" />

<!-- After: Properly associated label -->
<label for="email">Email</label>
<input type="email" id="email" />

<!-- Or using aria-labelledby for complex cases -->
<span id="email-label">Email address</span>
<input type="email" aria-labelledby="email-label" />
```

### 4. Skip Links

```html
<!-- Add at the very beginning of body -->
<a href="#main-content" class="skip-link"> Skip to main content </a>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    padding: 8px;
    background: var(--primary);
    color: white;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
```

### 5. ARIA Labels for Icon Buttons

```html
<!-- Before: No accessible name -->
<button>
  <svg><!-- menu icon --></svg>
</button>

<!-- After: Screen reader friendly -->
<button aria-label="Open navigation menu">
  <svg aria-hidden="true"><!-- menu icon --></svg>
</button>
```

## Testing with Real Users

The most valuable insight came from testing with a screen reader:

```typescript
// What I thought was fine
<div onClick={handleClick}>Click me</div>

// What screen reader users experience:
// Nothing. It's not focusable or announced.

// The fix
<button onClick={handleClick}>Click me</button>
```

## Semantic HTML Wins

```html
<!-- Instead of -->
<div class="nav">
  <div class="nav-item">Home</div>
</div>

<!-- Use -->
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

## Key Insight

Accessibility isn't optional—it's how you serve all your users. The fixes that helped screen reader users also improved keyboard navigation, which benefits power users. Many accessibility improvements also boost SEO.

Start with automated tools, but always test manually. Real screen reader testing revealed issues that no automated tool caught.
