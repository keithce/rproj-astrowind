---
title: 'Integrating Vercel Speed Insights for Real User Metrics'
date: 2025-03-23
tags: ['vercel', 'performance', 'monitoring', 'web-vitals']
description: 'Today I learned how to integrate Vercel Speed Insights to get real-world performance metrics from actual users, not just Lighthouse synthetic tests.'
draft: false
---

# Integrating Vercel Speed Insights for Real User Metrics

Lighthouse scores are great, but they're synthetic. Today I integrated Vercel Speed Insights to get real user metrics (RUM).

## Why Real User Metrics Matter

Lighthouse runs in a controlled environment. Real users have:

- Varying network conditions
- Different device capabilities
- Various geographic locations
- Actual interaction patterns

## Quick Integration

```astro
---
import { SpeedInsights } from '@vercel/speed-insights/astro';
---

<SpeedInsights />
```

That's it! Vercel automatically starts collecting:

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)

## Insights from Real Data

After a week of data, I discovered that mobile users in certain regions were experiencing significantly slower TTFB than my Lighthouse tests suggested. This led to investigating edge caching strategies.

The lesson: synthetic tests are a starting point, but real user metrics tell the true story.
