---
title: 'Implementing an Editorial Typography System'
date: 2025-12-30
tags: ['typography', 'design-system', 'fonts', 'css']
description: 'Today I learned how to implement a three-font typography system that balances personality with readability.'
draft: false
---

# Implementing an Editorial Typography System

Typography is the foundation of design. Today I implemented a three-font editorial system that gives the site a distinct personality while maintaining readability.

## The Three-Font Strategy

1. **Display Font**: Headlines and hero text (personality)
2. **Body Font**: Paragraphs and long-form content (readability)
3. **UI Font**: Navigation, buttons, labels (clarity)

## Implementation in Starwind CSS

```css
/* starwind.css */
:root {
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Sans Pro', sans-serif;
  --font-ui: 'Inter', system-ui, sans-serif;
}

.heading-1,
.heading-2 {
  font-family: var(--font-display);
  font-weight: 700;
}

.body-text,
.prose {
  font-family: var(--font-body);
  line-height: 1.75;
}

.button,
.nav-link,
.label {
  font-family: var(--font-ui);
  font-weight: 500;
}
```

## The Iteration Process

Getting fonts right took several attempts:

1. First try: Too many weights, slow load times
2. Second try: Fonts clashed in personality
3. Final: Complementary serifs and sans-serifs with limited weights

## Key Insight

Limiting font weights to what you actually use (typically 400, 500, 700) dramatically improves load times. Variable fonts help here—one file, all weights. But more importantly, a cohesive typography system creates visual harmony that users feel even if they can't articulate why the site "feels professional."
