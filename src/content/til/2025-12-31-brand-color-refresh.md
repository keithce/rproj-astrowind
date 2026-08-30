---
title: 'Refreshing a Brand Color Palette Systematically'
date: 2025-12-31
tags: ['design', 'color-theory', 'brand', 'css-variables']
description: 'Today I learned how to systematically refresh a color palette while maintaining accessibility and consistency across light and dark modes.'
draft: false
---

# Refreshing a Brand Color Palette Systematically

A color refresh sounds simple—just pick new colors, right? Today I learned there's a systematic approach that ensures consistency and accessibility.

## The Process

### 1. Define Semantic Colors

Don't think "blue button," think "primary action":

```css
:root {
  --color-primary: /* main brand color */;
  --color-secondary: /* supporting actions */;
  --color-accent: /* highlights, CTAs */;
  --color-muted: /* backgrounds, borders */;
  --color-destructive: /* errors, deletions */;
}
```

### 2. Generate a Scale

Each color needs a scale from light to dark:

```css
--color-primary-50: /* lightest, backgrounds */;
--color-primary-100: /* ... */;
--color-primary-500: /* base color */;
--color-primary-900: /* darkest, text */;
```

### 3. Ensure Accessibility

Check contrast ratios for text/background combinations:

```typescript
function meetsWCAG(textColor: string, bgColor: string): boolean {
  const ratio = getContrastRatio(textColor, bgColor);
  return ratio >= 4.5; // AA standard for normal text
}
```

### 4. Dark Mode Mapping

Don't just invert—remap semantically:

```css
.dark {
  --color-primary-500: var(--color-primary-400); /* slightly lighter in dark mode */
  --color-surface: var(--color-gray-900);
}
```

## Key Insight

The "500" in a color scale should represent the brand color at its purest form. Everything else derives from it. When you change the primary color, the entire palette updates mathematically, ensuring consistency across hundreds of UI elements.
