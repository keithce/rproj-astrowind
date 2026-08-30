---
title: 'Convex: Real-Time Data Without WebSocket Complexity'
date: 2025-06-16
tags: ['convex', 'backend', 'real-time', 'typescript']
description: 'Today I learned how Convex eliminates the complexity of building real-time applications with type-safe queries and automatic reactivity.'
draft: false
---

# Convex: Real-Time Data Without WebSocket Complexity

Setting up a real-time backend usually means wrestling with WebSockets, managing connections, and handling reconnection logic. Today I discovered that Convex makes this trivially simple.

## The Traditional Approach

Building real-time features typically requires:

```typescript
// Server: Set up WebSocket handling
const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', ws => {
  ws.on('message', handleMessage);
  ws.on('close', handleDisconnect);
  // Handle reconnection, heartbeats, etc.
});

// Client: Manage connection state
const socket = new WebSocket('ws://localhost:8080');
socket.onopen = () => {
  /* reconnection logic */
};
socket.onclose = () => {
  /* retry with backoff */
};
```

## The Convex Way

With Convex, real-time updates are automatic:

```typescript
// convex/users.ts - Define your query
import { query } from './_generated/server';
import { v } from 'convex/values';

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('clerkId'), userId))
      .first();
  },
});

// React/Solid component - Use the query
const profile = useQuery(api.users.getProfile, { userId });
// Automatically updates when data changes!
```

## Type Safety End-to-End

The best part is the type safety that flows from database to UI:

```typescript
// Schema definition
const users = defineTable({
  clerkId: v.string(),
  email: v.string(),
  birthDetails: v.optional(
    v.object({
      date: v.string(),
      time: v.string(),
      location: v.string(),
    })
  ),
});

// TypeScript knows the exact shape everywhere
const user = useQuery(api.users.getProfile, { userId });
user?.birthDetails?.date; // Fully typed!
```

## Mutations Are Just as Simple

```typescript
// convex/users.ts
export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      emailFrequency: v.array(v.string()),
      timezone: v.string(),
    }),
  },
  handler: async (ctx, { userId, preferences }) => {
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('clerkId'), userId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { preferences });
    }
  },
});
```

## Key Insight

Convex's type-safe queries eliminate an entire class of backend bugs. When your schema changes, TypeScript immediately tells you every place in your codebase that needs updating. No more runtime errors from mismatched field names or types.

The mental model shift: think of your backend as a reactive database that your frontend subscribes to, not an API you poll.
