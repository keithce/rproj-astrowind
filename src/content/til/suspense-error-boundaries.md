---
title: 'Suspense Boundaries: Isolating Failures in React/Solid Apps'
date: 2026-01-05
tags: ['react', 'solidjs', 'error-handling', 'architecture']
description: 'Today I learned that granular Suspense and Error Boundaries prevent cascading failures and dramatically improve perceived performance.'
draft: false
---

# Suspense Boundaries: Isolating Failures in React/Solid Apps

A single failed API call shouldn't crash your entire dashboard. Granular Suspense and Error Boundaries create resilient UIs that degrade gracefully.

## The Problem: Cascading Failures

```tsx
// One failing query kills everything
function Dashboard() {
  const user = useQuery(userQuery); // ✓ Works
  const events = useQuery(eventsQuery); // ✗ Server error
  const lunar = useQuery(lunarQuery); // Never even tries

  // User sees: blank screen or error page
  return <DashboardLayout>...</DashboardLayout>;
}
```

## The Solution: Granular Boundaries

```tsx
function Dashboard() {
  return (
    <DashboardLayout>
      <ErrorBoundary fallback={<UserCardError />}>
        <Suspense fallback={<UserCardSkeleton />}>
          <UserCard />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<EventsError />}>
        <Suspense fallback={<EventsSkeleton />}>
          <EventsSection />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<LunarError />}>
        <Suspense fallback={<LunarSkeleton />}>
          <LunarPhaseCard />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
```

Now if events fail, users still see their profile and lunar data.

## Error Boundary with Retry

```tsx
function SectionErrorBoundary({ children, fallback, sectionName }: Props) {
  const [error, setError] = createSignal<Error | null>(null);

  const retry = () => {
    setError(null);
    // Force re-render of children
  };

  return (
    <ErrorBoundary
      fallback={(err, reset) => (
        <ErrorCard
          title={`${sectionName} unavailable`}
          message="We couldn't load this section."
          onRetry={() => {
            reset();
            retry();
          }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## Skeleton Components for Perceived Performance

```tsx
// Match the exact layout of the real component
function EventsSkeleton() {
  return (
    <div class="events-section">
      <div class="skeleton h-8 w-48 mb-4" /> {/* Header */}
      <div class="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} class="skeleton h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// CSS for skeleton animation
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    var(--muted-foreground) 50%,
    var(--muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## RefetchIndicator for Background Updates

```tsx
function RefetchIndicator({ query }: { query: Query }) {
  return (
    <Show when={query.isFetching && !query.isLoading}>
      <div class="absolute right-2 top-2">
        <div class="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      </div>
    </Show>
  );
}

function EventsSection() {
  const events = createQuery(() => eventsQuery);

  return (
    <div class="relative">
      <RefetchIndicator query={events} />
      <EventsList events={events.data} />
    </div>
  );
}
```

## Pattern: Section Component Structure

```tsx
function DashboardSection({ title, query, skeleton, children }: SectionProps) {
  return (
    <section class="dashboard-section">
      <header class="flex items-center justify-between">
        <h2>{title}</h2>
        <RefetchIndicator query={query} />
      </header>

      <ErrorBoundary fallback={<SectionError title={title} />}>
        <Suspense fallback={skeleton}>{children}</Suspense>
      </ErrorBoundary>
    </section>
  );
}
```

## Key Insight

Think of Suspense boundaries as "loading zones" and Error boundaries as "blast shields." Place them strategically:

1. Around independent data fetches
2. Around third-party components
3. Around user-generated content rendering

The goal: a failure in one zone shouldn't affect others. Users should always see _something_—partial data is better than a blank screen.
