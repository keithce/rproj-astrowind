---
title: 'TanStack Query: Server State Is Not Client State'
date: 2025-08-02
tags: ['tanstack-query', 'react', 'solidjs', 'caching', 'performance']
description: 'Today I learned that TanStack Query handles caching, revalidation, and background updates better than any custom solution I could write.'
draft: false
---

# TanStack Query: Server State Is Not Client State

I spent weeks building custom data fetching utilities before discovering that TanStack Query handles every edge case I hadn't even considered. The mental model shift was profound.

## The Old Way: Custom Fetching

```typescript
// My custom hook (simplified)
function useData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

This misses: caching, background refetching, stale-while-revalidate, deduplication, retry logic, prefetching, and more.

## The TanStack Query Way

```typescript
import { createQuery } from '@tanstack/solid-query';

const weekEvents = createQuery(() => ({
  queryKey: ['events', 'week', weekStart.toString()],
  queryFn: () => fetchWeekEvents(weekStart),
  staleTime: 5 * 60 * 1000, // 5 minutes
  placeholderData: previousData, // Show previous week while loading
}));
```

## Centralized Query Keys

The game-changer was centralizing query keys:

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  events: {
    all: ['events'] as const,
    week: (date: string) => ['events', 'week', date] as const,
    month: (date: string) => ['events', 'month', date] as const,
  },
  user: {
    profile: (id: string) => ['user', 'profile', id] as const,
    preferences: (id: string) => ['user', 'preferences', id] as const,
  },
};

// Usage
const events = createQuery(() => ({
  queryKey: queryKeys.events.week(weekStart),
  queryFn: () => fetchWeekEvents(weekStart),
}));

// Invalidate all event queries
queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
```

## Prefetching Adjacent Data

For a week-view calendar, prefetch next/previous weeks:

```typescript
// Prefetch adjacent weeks when current week loads
createEffect(() => {
  if (weekEvents.data) {
    const nextWeek = addDays(weekStart, 7);
    const prevWeek = addDays(weekStart, -7);

    queryClient.prefetchQuery({
      queryKey: queryKeys.events.week(nextWeek.toString()),
      queryFn: () => fetchWeekEvents(nextWeek),
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.events.week(prevWeek.toString()),
      queryFn: () => fetchWeekEvents(prevWeek),
    });
  }
});
```

## placeholderData Prevents Loading Flashes

```typescript
const weekEvents = createQuery(() => ({
  queryKey: queryKeys.events.week(weekStart),
  queryFn: () => fetchWeekEvents(weekStart),
  placeholderData: previousData => previousData, // Smooth transitions!
}));
```

## Key Insight

Server state and client state are fundamentally different. Server state is owned elsewhere, can become stale, and needs synchronization strategies. Client state (like form inputs or UI toggles) is local and immediate.

TanStack Query handles server state; use signals/useState for client state. Don't mix them.
