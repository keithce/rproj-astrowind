---
title: 'React Email: Beautiful Emails with Component Architecture'
date: 2025-08-27
tags: ['email', 'react', 'templates', 'resend']
description: 'Today I learned that email HTML is its own special hell, but React Email makes it manageable with familiar component patterns.'
draft: false
---

# React Email: Beautiful Emails with Component Architecture

Email HTML is notoriously difficult—tables for layout, inline styles, and inconsistent client support. React Email abstracts this nightmare into familiar components.

## The Problem with Email HTML

```html
<!-- Traditional email HTML is a nightmare -->
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding: 20px; font-family: Arial, sans-serif;">
      <table width="600" cellpadding="0" cellspacing="0">
        <!-- Nested tables forever... -->
      </table>
    </td>
  </tr>
</table>
```

## React Email Components

```tsx
import { Html, Head, Body, Container, Section, Text, Button, Img, Hr } from '@react-email/components';

export function WeeklyDigestEmail({ userName, events, weekStart }: WeeklyDigestProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Img src="https://example.com/logo.png" width={120} height={40} alt="Logo" />

          <Section>
            <Text style={styles.greeting}>Hi {userName},</Text>
            <Text style={styles.intro}>Here's your cosmic forecast for the week of {weekStart}.</Text>
          </Section>

          <Hr style={styles.divider} />

          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}

          <Section style={styles.cta}>
            <Button href="https://app.example.com/dashboard" style={styles.button}>
              View Full Dashboard
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

## Reusable Components

```tsx
// components/EventCard.tsx
function EventCard({ event }: { event: Event }) {
  return (
    <Section style={styles.eventCard}>
      <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
      <Text style={styles.eventTitle}>
        {event.emoji} {event.title}
      </Text>
      <Text style={styles.eventDescription}>{event.description}</Text>
    </Section>
  );
}
```

## Tailwind Integration

React Email supports Tailwind CSS:

```tsx
import { Tailwind } from '@react-email/components';

export function Email() {
  return (
    <Html>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto rounded-lg bg-white p-8">
            <Text className="text-2xl font-bold text-gray-900">Welcome!</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

## Preview and Testing

```bash
# Run the preview server
npx react-email dev

# Or export to HTML
npx react-email export
```

## Integration with Resend

```typescript
import { Resend } from 'resend';
import { WeeklyDigestEmail } from './emails/weekly-digest';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Cosmic Updates <updates@example.com>',
  to: user.email,
  subject: `Your Week Ahead: ${weekStart}`,
  react: WeeklyDigestEmail({
    userName: user.name,
    events,
    weekStart,
  }),
});
```

## Key Insight

Email delivery needs tracking—you need to know if messages arrive. Set up webhooks to track delivery status:

```typescript
// Handle Resend webhooks
export async function handleEmailWebhook(event: ResendEvent) {
  switch (event.type) {
    case 'email.delivered':
      await markEmailDelivered(event.data.email_id);
      break;
    case 'email.bounced':
      await handleBounce(event.data.email_id, event.data.reason);
      break;
    case 'email.complained':
      await handleSpamComplaint(event.data.email_id);
      break;
  }
}
```

React Email makes email development feel like regular React development. The component model means you can build a design system for emails just like you would for your web app.
