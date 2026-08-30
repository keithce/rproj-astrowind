---
title: 'JavaScript Dates Are Broken—Temporal API Fixes Them'
date: 2025-12-04
tags: ['javascript', 'temporal', 'dates', 'typescript']
description: 'Today I learned that the Temporal API eliminates entire categories of date bugs by providing timezone-aware, immutable date handling in JavaScript.'
draft: false
---

# JavaScript Dates Are Broken—Temporal API Fixes Them

While building timezone-aware features for a planning dashboard, I discovered that JavaScript's native `Date` object is fundamentally broken for real-world applications. The Temporal API is the solution I didn't know I needed.

## The Problem with Native Dates

JavaScript's `Date` object has several critical flaws:

```javascript
// Mutation madness
const date = new Date('2025-12-04');
date.setDate(date.getDate() + 1); // Mutates the original!

// Timezone confusion
new Date('2025-12-04').toISOString(); // Assumes UTC
new Date('2025-12-04T00:00:00').toISOString(); // Assumes local time

// Month indexing starts at 0
new Date(2025, 12, 4); // Actually January 2026!
```

## Enter the Temporal API

The Temporal API provides immutable, timezone-aware date handling:

```typescript
import { Temporal } from '@js-temporal/polyfill';

// Immutable operations
const date = Temporal.PlainDate.from('2025-12-04');
const tomorrow = date.add({ days: 1 }); // Returns NEW date

// Explicit timezone handling
const zonedDateTime = Temporal.ZonedDateTime.from({
  timeZone: 'America/New_York',
  year: 2025,
  month: 12,
  day: 4,
  hour: 10,
});

// Easy conversions
const utc = zonedDateTime.toInstant();
const localDate = zonedDateTime.toPlainDate();
```

## Real-World Application

In my dashboard, I needed to show "today's events" correctly for users in different timezones:

```typescript
// Get today in user's timezone
const userTimezone = 'America/Los_Angeles';
const now = Temporal.Now.zonedDateTimeISO(userTimezone);
const today = now.toPlainDate();

// Compare dates without timezone confusion
const eventDate = Temporal.PlainDate.from(event.date);
const isToday = Temporal.PlainDate.compare(today, eventDate) === 0;
```

## Key Insight

The key insight was implementing a `MidnightInvalidationHook` that uses Temporal to detect when the date changes in the user's timezone, then invalidates date-dependent queries. This eliminated the "wrong day" bugs that plagued the app.

Test your app in different timezones—bugs hide there. The Temporal API makes timezone-aware code readable and correct by default.
