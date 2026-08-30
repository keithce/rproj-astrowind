---
title: 'Adding Pagination and Breadcrumbs with Starwind UI'
date: 2025-10-05
tags: ['starwind', 'ui-components', 'accessibility', 'astro']
description: 'Today I learned how to implement accessible pagination and breadcrumb components using Starwind UI in Astro.'
draft: false
---

# Adding Pagination and Breadcrumbs with Starwind UI

Navigation components are deceptively complex. Today I integrated Starwind UI's pagination and breadcrumb components for proper accessibility.

## Why Not Build From Scratch?

Accessible navigation requires:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Focus management

Getting all of this right is non-trivial. Starwind provides battle-tested components.

## Pagination Component

```astro
---
import { Pagination } from '@/components/ui/Pagination';
const { page, totalPages } = Astro.props;
---

<Pagination
  currentPage={page}
  totalPages={totalPages}
  baseUrl="/blog"
  showFirstLast={true}
  aria-label="Blog pagination"
/>
```

The component automatically handles:

- Disabled states for first/last pages
- Ellipsis for large page counts
- `aria-current="page"` for the active page

## Breadcrumb Component

```astro
---
import { Breadcrumbs, Breadcrumb } from '@/components/ui/Breadcrumbs';
---

<Breadcrumbs aria-label="Breadcrumb navigation">
  <Breadcrumb href="/">Home</Breadcrumb>
  <Breadcrumb href="/blog">Blog</Breadcrumb>
  <Breadcrumb current>Current Post</Breadcrumb>
</Breadcrumbs>
```

Includes:

- Proper `nav` landmark
- Schema.org structured data support
- Visual separators that are hidden from screen readers

## Key Insight

Accessibility is easier when you use components designed for it. The time saved not debugging ARIA issues is worth the dependency.
