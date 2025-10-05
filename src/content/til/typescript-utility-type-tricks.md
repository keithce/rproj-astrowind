---
title: 'TypeScript Utility Type Tricks'
date: 2025-06-17
tags: ['typescript', 'programming', 'web development']
description: 'Today I learned about some lesser-known but incredibly useful TypeScript
  utility types that have improved my type safety.'
draft: false
---

# TypeScript Utility Type Tricks

Today I discovered some TypeScript utility types that have significantly
improved my code's type safety and readability.

## Record<K, T>

While I knew about `Record` before, I hadn't fully leveraged its power for
creating objects with specific key-value types:

```typescript
// Instead of this
type Routes = {
  [key: string]: {
    path: string;
    auth: boolean;
  };
};

// Use this
type Route = {
  path: string;
  auth: boolean;
};

type Routes = Record<string, Route>;
```

## Pick<T, K> and Omit<T, K>

These utilities are fantastic for creating derived types:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Only the fields we want
type UserPublicProfile = Pick<User, 'id' | 'name'>;

// Everything except sensitive fields
type SafeUser = Omit<User, 'password'>;
```

## Parameters<T> and ReturnType<T>

These provide access to function types:

```typescript
function fetchUser(id: number, includeProfile: boolean): Promise<User> {
  // implementation...
}

// Extract parameter types
type FetchUserParams = Parameters<typeof fetchUser>;
// [number, boolean]

// Extract return type
type FetchUserReturn = ReturnType<typeof fetchUser>;
// Promise<User>
```

## Partial<T> and Required<T>

These modify the optionality of properties:

```typescript
interface Config {
  endpoint: string;
  timeout: number;
  retries?: number;
  headers?: Record<string, string>;
}

// All properties become optional
type PartialConfig = Partial<Config>;

// All properties become required
type StrictConfig = Required<Config>;
```

## Template Literal Types

The newest discovery for me was template literal types:

```typescript
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = '/users' | '/posts' | '/comments';

// Creates union: 'GET /users' | 'POST /users' | 'GET /posts' | etc.
type APIRoute = `${HTTPMethod} ${Endpoint}`;
```

These utility types have made my TypeScript code more concise, expressive, and
most importantly, safer.
