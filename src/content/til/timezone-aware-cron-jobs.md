---
title: 'Timezone-Aware Cron Jobs: Scheduling Across the Globe'
date: 2025-08-18
tags: ['cron', 'scheduling', 'timezone', 'backend']
description: 'Today I learned that scheduled tasks need to respect user timezones religiously, and cohort-based processing makes global scheduling manageable.'
draft: false
---

# Timezone-Aware Cron Jobs: Scheduling Across the Globe

Sending "Good morning!" emails at 3 AM destroys user trust. Today I learned how to build a scheduling system that respects user timezones.

## The Naive Approach (Don't Do This)

```typescript
// Runs at 8 AM UTC for everyone
cron.schedule('0 8 * * *', async () => {
  const users = await getAllUsers();
  for (const user of users) {
    await sendDailyEmail(user); // 3 AM in New York, 4 PM in Tokyo
  }
});
```

## Cohort-Based Processing

Group users by timezone and process cohorts at their local times:

```typescript
// convex/crons.ts
export const cronJobs = cronJobs({
  // Run every hour, process users whose local time is now 8 AM
  dailyEmailDispatch: {
    schedule: '0 * * * *', // Every hour on the hour
    handler: dailyEmailHandler,
  },
});

// convex/emails.ts
export const dailyEmailHandler = internalAction({
  handler: async ctx => {
    const now = new Date();
    const currentHourUTC = now.getUTCHours();

    // Find timezones where it's currently 8 AM
    const targetTimezones = getTimezonesForLocalHour(8, currentHourUTC);

    // Get users in those timezones
    const users = await ctx.runQuery(internal.users.getUsersByTimezones, {
      timezones: targetTimezones,
    });

    // Send emails
    for (const user of users) {
      await ctx.runAction(internal.emails.sendDailyEmail, { userId: user._id });
    }
  },
});
```

## Mapping UTC Hours to Timezones

```typescript
function getTimezonesForLocalHour(targetLocalHour: number, currentUTCHour: number): string[] {
  // Calculate what UTC offset would make it targetLocalHour right now
  // targetLocalHour = currentUTCHour + offset
  // offset = targetLocalHour - currentUTCHour
  let targetOffset = targetLocalHour - currentUTCHour;

  // Normalize to valid offset range (-12 to +14)
  if (targetOffset < -12) targetOffset += 24;
  if (targetOffset > 14) targetOffset -= 24;

  // Map offsets to timezone identifiers
  return TIMEZONE_OFFSET_MAP[targetOffset] || [];
}

// Comprehensive mapping
const TIMEZONE_OFFSET_MAP: Record<number, string[]> = {
  [-5]: ['America/New_York', 'America/Toronto'],
  [-8]: ['America/Los_Angeles', 'America/Vancouver'],
  [0]: ['Europe/London', 'UTC'],
  [1]: ['Europe/Paris', 'Europe/Berlin'],
  [9]: ['Asia/Tokyo', 'Asia/Seoul'],
  // ... etc
};
```

## User Timezone Storage

```typescript
// Store user's timezone preference
const userSchema = defineTable({
  email: v.string(),
  preferences: v.object({
    timezone: v.string(), // e.g., 'America/New_York'
    emailTime: v.number(), // Preferred hour (0-23)
    emailFrequency: v.array(v.string()), // ['daily', 'weekly']
  }),
});
```

## Weekly/Monthly Scheduling

```typescript
export const weeklyEmailHandler = internalAction({
  handler: async ctx => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();

    // Only run on Sundays (or user's preferred day)
    if (dayOfWeek !== 0) return;

    const currentHourUTC = now.getUTCHours();
    const targetTimezones = getTimezonesForLocalHour(9, currentHourUTC);

    const users = await ctx.runQuery(internal.users.getUsersForWeekly, {
      timezones: targetTimezones,
    });

    for (const user of users) {
      await ctx.runAction(internal.emails.sendWeeklyDigest, {
        userId: user._id,
      });
    }
  },
});
```

## Handling DST Transitions

Daylight Saving Time causes timezone offsets to change:

```typescript
import { Temporal } from '@js-temporal/polyfill';

function getTimezoneOffset(timezone: string, date: Date): number {
  const instant = Temporal.Instant.from(date.toISOString());
  const zonedDateTime = instant.toZonedDateTimeISO(timezone);

  // Returns offset in minutes
  return zonedDateTime.offsetNanoseconds / 1_000_000_000 / 60;
}

// Use Temporal for DST-aware calculations
function getLocalHour(utcHour: number, timezone: string): number {
  const now = Temporal.Now.instant();
  const zoned = now.toZonedDateTimeISO(timezone);
  return zoned.hour;
}
```

## Notification Batching

Prevent API rate limits with batching:

```typescript
async function processEmailCohort(users: User[]) {
  const BATCH_SIZE = 50;
  const BATCH_DELAY_MS = 1000;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(user => sendEmail(user)));

    if (i + BATCH_SIZE < users.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
}
```

## Key Insight

Timezone handling is not optional—it's a core feature. Users notice when emails arrive at wrong times, even if they can't articulate what's wrong. The cohort-based approach scales well: instead of individual timers per user, you process groups hourly.

Store timezone as IANA identifiers (like 'America/New_York'), not offsets. Offsets change with DST; identifiers handle this automatically.
