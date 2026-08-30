---
title: 'Building a Notion-Powered Contact Form'
date: 2025-05-27
tags: ['notion', 'api', 'forms', 'astro']
description: 'Today I learned how to submit form data directly to a Notion database, creating a serverless CRM-like system.'
draft: false
---

# Building a Notion-Powered Contact Form

Why pay for a form backend when Notion can be your database? Today I implemented a contact form that submits directly to Notion.

## The Architecture

```
User submits form → Astro API route → Notion API → Database entry
```

## Setting Up the Notion Integration

1. Create a Notion integration at notion.so/my-integrations
2. Share your database with the integration
3. Store the token securely in environment variables

## The API Route

```typescript
// src/pages/api/submit-to-notion.ts
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST({ request }) {
  const data = await request.formData();

  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      Name: { title: [{ text: { content: data.get('name') } }] },
      Email: { email: data.get('email') },
      Message: { rich_text: [{ text: { content: data.get('message') } }] },
    },
  });

  return redirect('/thank-you');
}
```

## Benefits Over Traditional Forms

- **No additional service costs** - Notion's API is free
- **Built-in collaboration** - Team can see and respond to inquiries
- **Flexible schema** - Add fields to your database anytime
- **Views and filters** - Sort by date, filter by status, etc.

The key insight: Notion databases are surprisingly powerful backends for simple data collection needs.
