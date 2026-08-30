---
title: 'Building a TIL Content Collection in Astro'
date: 2025-07-08
tags: ['astro', 'content-collections', 'markdown', 'blog']
description: 'Today I learned how to create a "Today I Learned" content collection in Astro with social feed and kanban views.'
draft: false
---

# Building a TIL Content Collection in Astro

Meta moment: I'm writing a TIL about building the TIL section! Today I implemented a "Today I Learned" feature with multiple view options.

## Defining the Collection Schema

```typescript
// src/content/config.ts
const tilCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      tags: z.array(z.string()),
      description: z.string(),
      draft: z.boolean().optional(),
      image: image().optional(),
    }),
});
```

## Multiple Views

I implemented two views for browsing TIL entries:

### Social Feed View

Chronological list, Twitter-style:

```astro
{
  entries.map(entry => (
    <article class="til-entry">
      <time>{entry.data.date}</time>
      <h3>{entry.data.title}</h3>
      <p>{entry.data.description}</p>
      <div class="tags">
        {entry.data.tags.map(t => (
          <span>{t}</span>
        ))}
      </div>
    </article>
  ))
}
```

### Kanban Board View

Entries grouped by week, with pagination:

```astro
{
  weeks.map(week => (
    <div class="week-column">
      <h4>Week of {week.startDate}</h4>
      {week.entries.map(entry => (
        <TilCard {entry} />
      ))}
    </div>
  ))
}
```

## Key Insight

The view toggle is saved to localStorage, so users' preference persists. Small UX touches like this make the difference between a feature people use and one they forget about.

Content collections in Astro make it trivial to add new content types—schema validation, TypeScript types, and query utilities all come free.
