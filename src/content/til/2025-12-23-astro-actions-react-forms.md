---
title: 'Modern Form Handling with Astro Actions and React useActionState'
date: 2025-12-23
tags: ['astro', 'react', 'forms', 'actions', 'validation']
description: 'Today I learned how to combine Astro Actions with React useActionState for type-safe, progressively enhanced forms.'
draft: false
---

# Modern Form Handling with Astro Actions and React useActionState

Forms are a solved problem... right? Today I upgraded the contact form to use Astro Actions with React's useActionState for the best of both worlds.

## Why This Combo?

- **Astro Actions**: Server-side validation, type safety, works without JS
- **React useActionState**: Optimistic updates, loading states, error handling

## Defining the Action

```typescript
// src/actions/contact.ts
import { defineAction, z } from 'astro:actions';

export const submitContact = defineAction({
  input: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
  }),
  handler: async ({ name, email, message }) => {
    // Submit to Notion, send email, etc.
    await notionClient.pages.create({
      /* ... */
    });
    return { success: true };
  },
});
```

## The React Form Component

```tsx
// src/components/ContactForm.tsx
import { useActionState } from 'react';
import { actions } from 'astro:actions';

export function ContactForm() {
  const [state, action, pending] = useActionState(actions.submitContact, { success: false, errors: {} });

  return (
    <form action={action}>
      <input name="name" disabled={pending} />
      {state.errors?.name && <span>{state.errors.name}</span>}

      <button type="submit" disabled={pending}>
        {pending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

## Key Insight

Astro Actions provide the progressive enhancement baseline (form works without JS), while useActionState adds the polish (loading states, inline errors, optimistic updates). Type safety flows from action definition to form inputs automatically.
