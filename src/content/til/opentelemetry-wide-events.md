---
title: 'OpenTelemetry: Structured Logging Beats console.log at Scale'
date: 2026-01-03
tags: ['opentelemetry', 'observability', 'logging', 'devops']
description: 'Today I learned that wide events architecture captures full request context efficiently, making debugging production issues much faster.'
draft: false
---

# OpenTelemetry: Structured Logging Beats console.log at Scale

After drowning in unstructured logs, I discovered that OpenTelemetry's wide events pattern transforms debugging from archaeology into science.

## The Problem with console.log

```typescript
// Scattered logs tell no story
console.log('Processing request');
console.log('User ID:', userId);
console.log('Fetching data...');
console.log('Data fetched:', data.length, 'items');
console.log('Request complete');

// In production logs, good luck correlating these!
```

## Wide Events Pattern

One comprehensive event per request:

```typescript
// lib/telemetry/request-event.ts
export class RequestEvent {
  private data: Record<string, unknown> = {};
  private startTime: number;

  constructor(requestId: string) {
    this.startTime = performance.now();
    this.set('requestId', requestId);
    this.set('timestamp', new Date().toISOString());
  }

  set(key: string, value: unknown) {
    this.data[key] = value;
    return this;
  }

  setUser(user: { id: string; tier: string }) {
    this.set('userId', user.id);
    this.set('userTier', user.tier);
    return this;
  }

  setError(error: Error) {
    this.set('error', error.message);
    this.set('errorStack', error.stack);
    this.set('errorType', error.constructor.name);
    return this;
  }

  send() {
    this.set('durationMs', performance.now() - this.startTime);
    telemetry.emit('request', this.data);
  }
}
```

## Usage in Request Handlers

```typescript
// server/api/dashboard.ts
export async function getDashboard(req: Request) {
  const event = new RequestEvent(req.id);

  try {
    const user = await getUser(req);
    event.setUser(user);

    const events = await fetchEvents(user.id);
    event.set('eventsCount', events.length);

    const lunar = await fetchLunarData(user.timezone);
    event.set('lunarPhase', lunar.phase);

    event.set('status', 'success');
    return { events, lunar };
  } catch (error) {
    event.setError(error as Error);
    event.set('status', 'error');
    throw error;
  } finally {
    event.send();
  }
}
```

## tRPC Middleware Integration

```typescript
// server/trpc.ts
const telemetryMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const event = new RequestEvent(ctx.requestId);
  event.set('procedure', path);
  event.set('type', 'trpc');

  if (ctx.user) {
    event.setUser(ctx.user);
  }

  try {
    const result = await next();
    event.set('status', 'success');
    return result;
  } catch (error) {
    event.setError(error as Error);
    event.set('status', 'error');
    throw error;
  } finally {
    event.send();
  }
});
```

## Server-Side Proxy for Analytics

```typescript
// routes/api/telemetry.ts
export async function POST(req: Request) {
  const events = await req.json();

  // Forward to Axiom/Datadog/etc
  await fetch('https://api.axiom.co/v1/datasets/events/ingest', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AXIOM_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(events),
  });

  return new Response('OK');
}
```

## Querying Wide Events

With wide events, queries become powerful:

```sql
-- Find slow requests for premium users
SELECT * FROM events
WHERE durationMs > 1000
  AND userTier = 'premium'
  AND timestamp > now() - interval '1 hour'

-- Error rate by procedure
SELECT
  procedure,
  count(*) FILTER (WHERE status = 'error') * 100.0 / count(*) as error_rate
FROM events
GROUP BY procedure
ORDER BY error_rate DESC
```

## Key Insight

Wide events capture full request context in a single log entry. Instead of hunting through scattered logs, you query a structured dataset. Every request becomes a self-contained debugging unit.

The pattern: accumulate context throughout request processing, emit once at the end. This is dramatically more useful than breadcrumb-style logging.
