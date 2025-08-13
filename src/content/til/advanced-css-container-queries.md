---
title: 'Advanced CSS Container Queries'
date: 2025-06-16
tags: ['css', 'responsive design', 'web development']
description:
  'Today I learned how to use CSS container queries to create truly
  component-based responsive designs that go beyond viewport dimensions.'
draft: false
---

# Advanced CSS Container Queries

Today I learned about CSS container queries, which are revolutionizing how we
approach responsive design. Unlike media queries that respond to the viewport
size, container queries allow elements to respond to the size of their parent
container.

## Basic Container Query Setup

First, you need to define a containment context:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Now we can query the container's width */
@container card (min-width: 400px) {
  .card-title {
    font-size: 1.5rem;
  }
}

@container card (max-width: 399px) {
  .card-title {
    font-size: 1rem;
  }
}
```

## Named vs. Anonymous Containers

You can use named or anonymous containers:

```css
/* Named container (shown above) */
.container {
  container-type: inline-size;
  container-name: sidebar;
}

/* Anonymous container (queries closest ancestor) */
.container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  /* Styles here apply to elements inside any anonymous container */
}
```

## Container Query Units

I also discovered container query units, which are relative to the container
size:

```css
.card-title {
  /* 10% of the container's width */
  font-size: 10cqw;

  /* 5% of the container's height */
  margin-bottom: 5cqh;

  /* Smaller value of container width or height */
  padding: 2cqi;

  /* Larger value of container width or height */
  max-width: 80cqb;
}
```

## Practical Application

The most impactful realization was how container queries enable truly modular
components:

```html
<div class="main-content">
  <div class="card-container">
    <!-- This card adapts to card-container width -->
    <div class="card">...</div>
  </div>
</div>

<div class="sidebar">
  <div class="card-container">
    <!-- Same card component, different layout context -->
    <div class="card">...</div>
  </div>
</div>
```

With container queries, the same component can adapt to different layout
contexts without needing different classes or overrides.

This approach dramatically improves component reusability and aligns perfectly
with component-based frameworks like Astro, React, or Vue.

## Browser Support

Container queries are now supported in all modern browsers, though older
browsers will need a polyfill or fallback approach.

This discovery has completely changed how I think about responsive design,
making it truly component-based rather than page-based.
