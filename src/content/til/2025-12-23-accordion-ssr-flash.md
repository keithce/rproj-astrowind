---
title: 'Fixing SSR Flash on Accordion Components'
date: 2025-12-23
tags: ['astro', 'ssr', 'accordion', 'hydration', 'starwind']
description: 'Today I learned how to prevent the flash of incorrect state when accordions hydrate with default-open items.'
draft: false
---

# Fixing SSR Flash on Accordion Components

Interactive components with default states can flash during hydration. Today I fixed an SSR flash issue on an accordion with a default-open item.

## The Problem

When an accordion has a default-open item:

1. Server renders the closed state (HTML default)
2. Page loads with closed accordion
3. JavaScript hydrates and opens the default item
4. User sees a jarring "flash" from closed to open

## The Solution

Render the correct initial state on the server:

```astro
---
// FAQ.astro
const defaultOpenId = 'faq-1';
---

<div class="accordion" data-default-open={defaultOpenId}>
  {
    faqs.map((faq, i) => (
      <details open={faq.id === defaultOpenId} data-accordion-item>
        <summary>{faq.question}</summary>
        <div class="content">{faq.answer}</div>
      </details>
    ))
  }
</div>
```

The key is using the native `<details>` element with `open` attribute for SSR, then enhancing with JavaScript for smooth animations.

## Progressive Enhancement Script

```typescript
// Only enhance, don't change initial state
document.querySelectorAll('[data-accordion-item]').forEach(item => {
  item.addEventListener('click', e => {
    // Add smooth height animation
    // Don't toggle open/closed - let browser handle that
  });
});
```

## Key Insight

SSR flash happens when server and client render different initial states. The fix is ensuring they match—not by removing SSR, but by making the server render the correct initial state. Progressive enhancement means the page works without JS and improves with it.
