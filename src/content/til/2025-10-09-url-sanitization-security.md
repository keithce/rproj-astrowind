---
title: 'Fixing URL Substring Sanitization Vulnerabilities'
date: 2025-10-09
tags: ['security', 'url-sanitization', 'code-scanning', 'codeql']
description: 'Today I learned about incomplete URL substring sanitization and how to properly validate URLs to prevent security vulnerabilities.'
draft: false
---

# Fixing URL Substring Sanitization Vulnerabilities

GitHub's code scanning flagged a potential security issue. Today I learned about URL substring sanitization attacks.

## The Vulnerability

CodeQL alert: "Incomplete URL substring sanitization"

The problem code:

```typescript
// Vulnerable: uses substring check
function isAllowedUrl(url: string): boolean {
  return url.includes('mysite.com');
}
```

Why it's dangerous:

- `https://evil.com/?redirect=mysite.com` passes the check
- `https://mysite.com.evil.com` passes the check
- An attacker can craft URLs that include the substring but redirect elsewhere

## The Fix

Use proper URL parsing:

```typescript
function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHosts = ['mysite.com', 'www.mysite.com'];
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}
```

## Better Yet: Use a Whitelist

```typescript
const ALLOWED_ORIGINS = new Set(['https://mysite.com', 'https://www.mysite.com']);

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.has(parsed.origin);
  } catch {
    return false;
  }
}
```

## Key Insight

String methods like `includes()`, `startsWith()`, or `indexOf()` are not sufficient for URL validation. Always parse URLs properly and check specific components (hostname, origin, protocol) rather than substring matching.
