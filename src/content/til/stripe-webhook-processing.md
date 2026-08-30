---
title: 'Stripe Webhooks: Every Payment Event Tells a Story'
date: 2025-11-08
tags: ['stripe', 'payments', 'webhooks', 'backend']
description: 'Today I learned that idempotent webhook processing prevents duplicate charges and that subscription status handling is far more complex than active/inactive.'
draft: false
---

# Stripe Webhooks: Every Payment Event Tells a Story

Implementing Stripe subscriptions taught me that payment integrations require meticulous error handling and that subscription status is definitely not binary.

## The Webhook Event Flow

Stripe sends a cascade of events during the subscription lifecycle:

```typescript
// Key events to handle
const SUBSCRIPTION_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'checkout.session.completed',
];
```

## Idempotent Processing Is Critical

The same webhook might be sent multiple times. Handle it:

```typescript
// convex/stripe.ts
export const handleWebhook = internalAction({
  args: { event: v.any() },
  handler: async (ctx, { event }) => {
    // Check if we've already processed this event
    const existing = await ctx.runQuery(internal.stripe.getProcessedEvent, {
      eventId: event.id,
    });

    if (existing) {
      console.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Process the event
    await processEvent(ctx, event);

    // Mark as processed
    await ctx.runMutation(internal.stripe.markEventProcessed, {
      eventId: event.id,
      processedAt: Date.now(),
    });
  },
});
```

## Subscription Status Mapping

Stripe's subscription statuses need mapping to your app's logic:

```typescript
type StripeStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'paused';

function mapSubscriptionStatus(stripeStatus: StripeStatus): AppStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'grace_period'; // Still give access, but warn user
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'inactive';
    case 'incomplete':
    case 'paused':
      return 'pending';
  }
}
```

## Checkout Success Flow

The moment after payment is crucial for user confidence:

```typescript
// src/routes/checkout/success.tsx
export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const syncStatus = createQuery(() => ({
    queryKey: ['checkout', 'sync', sessionId],
    queryFn: async () => {
      // Poll until subscription is synced
      const maxAttempts = 10;
      for (let i = 0; i < maxAttempts; i++) {
        const sub = await checkSubscriptionStatus(sessionId);
        if (sub.status === 'active') return sub;
        await delay(1000);
      }
      throw new Error('Subscription sync timeout');
    },
    retry: false,
  }));

  return (
    <Show when={syncStatus.isSuccess} fallback={<SyncingIndicator />}>
      <SuccessMessage subscription={syncStatus.data} />
    </Show>
  );
}
```

## Key Insight

Never trust client-side payment confirmation. Always verify via webhooks. The checkout session completing doesn't mean the payment succeeded—you need `invoice.payment_succeeded` for that.

Also, handle `invoice.payment_failed` gracefully. Users with payment issues are still your customers—give them a path to fix it rather than immediately cutting access.
