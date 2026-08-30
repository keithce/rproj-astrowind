---
title: 'Sending Beautiful Welcome Emails with React Email'
date: 2025-05-27
tags: ['react-email', 'email', 'automation', 'typescript']
description: 'Today I learned how React Email makes building and previewing HTML emails as easy as building React components.'
draft: false
---

# Sending Beautiful Welcome Emails with React Email

HTML emails are notoriously painful to build. Tables, inline styles, client quirks... Today I discovered React Email, and it changes everything.

## Why React Email?

- Write emails using React components
- Live preview during development
- Built-in components for common patterns
- TypeScript support out of the box

## Creating a Welcome Email

```tsx
// emails/WelcomeEmail.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export const WelcomeEmail = ({ name }: { name: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'sans-serif' }}>
      <Container>
        <Text>Welcome, {name}!</Text>
        <Text>Thanks for reaching out to Resonant Projects.</Text>
        <Button href="https://resonantprojects.art">Visit Our Site</Button>
      </Container>
    </Body>
  </Html>
);
```

## Rendering and Sending

```typescript
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail';

const html = render(<WelcomeEmail name="Keith" />);
// Send via your email provider (Resend, SendGrid, etc.)
```

## Key Insight

The preview server (`pnpm email dev`) lets you iterate on email designs instantly. No more "send test email → check inbox → tweak → repeat" cycles. Build your emails like you build your UI.
