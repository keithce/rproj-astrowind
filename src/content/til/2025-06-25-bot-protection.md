---
title: 'Protecting Forms with Vercel Bot Protection'
date: 2025-06-25
tags: ['security', 'vercel', 'forms', 'spam-prevention']
description: 'Today I learned how to integrate Vercel bot protection to stop spam submissions without annoying CAPTCHAs.'
draft: false
---

# Protecting Forms with Vercel Bot Protection

Spam bots love contact forms. Traditional CAPTCHAs frustrate real users. Today I implemented Vercel's invisible bot protection.

## The Problem with CAPTCHAs

- Accessibility issues
- User friction
- Increasingly difficult to solve (even for humans!)
- Bots are getting better at solving them anyway

## Vercel's Approach

Vercel's bot protection works invisibly by analyzing:

- Request patterns
- Browser fingerprints
- Behavioral signals

No user interaction required.

## Implementation

Add to your `vercel.json`:

```json
{
  "firewall": {
    "rules": [
      {
        "action": "challenge",
        "source": "api/submit-to-notion"
      }
    ]
  }
}
```

On the server side, verify the bot check:

```typescript
export async function POST({ request }) {
  const botVerification = request.headers.get('x-vercel-bot-protection');

  if (botVerification !== 'verified') {
    return new Response('Bot detected', { status: 403 });
  }

  // Process legitimate submission
}
```

## Results

After enabling bot protection, spam submissions dropped to nearly zero while legitimate submissions continued unaffected. The invisible nature means better UX with better security.
