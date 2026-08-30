---
title: 'Solid Primitives: From Custom Utils to Battle-Tested Libraries'
date: 2025-07-28
tags: ['solidjs', 'storage', 'refactoring', 'libraries']
description: "Today I learned that migrating to @solid-primitives/storage reduced my code by 75% while adding features I hadn't even thought of."
draft: false
---

# Solid Primitives: From Custom Utils to Battle-Tested Libraries

I spent days building custom localStorage utilities for my SolidJS app. Then I discovered @solid-primitives/storage and deleted 75% of my code.

## My Custom Implementation

```typescript
// What I built (200+ lines)
function createLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = createSignal<T>(defaultValue);

  // Initial load
  onMount(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setValue(JSON.parse(stored));
      } catch {
        setValue(defaultValue);
      }
    }
  });

  // Persist on change
  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(value()));
  });

  return [value, setValue] as const;
}
```

Problems I hadn't solved:

- SSR hydration mismatches
- Cross-tab synchronization
- Serialization of complex types
- Migration between schema versions

## The Solid Primitives Way

```typescript
import { makePersisted } from '@solid-primitives/storage';

// 3 lines instead of 200
const [preferences, setPreferences] = makePersisted(createSignal<UserPreferences>(defaultPreferences), {
  name: 'user-preferences',
});
```

## Features I Got for Free

### SSR-Safe Hydration

```typescript
// Automatically handles SSR
const [theme, setTheme] = makePersisted(createSignal<'light' | 'dark'>('light'), {
  name: 'theme',
  // No hydration mismatch!
});
```

### Cross-Tab Synchronization

```typescript
const [settings, setSettings] = makePersisted(createSignal(defaultSettings), {
  name: 'settings',
  sync: true, // Changes sync across tabs!
});
```

### Custom Serialization

```typescript
import { makePersisted } from '@solid-primitives/storage';

const [birthDate, setBirthDate] = makePersisted(createSignal<Date | null>(null), {
  name: 'birth-date',
  serialize: date => date?.toISOString() ?? '',
  deserialize: str => (str ? new Date(str) : null),
});
```

### Storage Backends

```typescript
// SessionStorage
const [session, setSession] = makePersisted(createSignal({}), {
  name: 'session',
  storage: sessionStorage,
});

// Custom async storage (IndexedDB, etc.)
const [data, setData] = makePersisted(createSignal({}), {
  name: 'large-data',
  storage: indexedDBStorage,
});
```

## Migration Pattern

When your schema changes:

```typescript
const CURRENT_VERSION = 2;

const [rawData, setRawData] = makePersisted(createSignal<VersionedData | null>(null), { name: 'app-data' });

// Derived signal with migration
const data = createMemo(() => {
  const raw = rawData();
  if (!raw) return defaultData;

  if (raw.version < CURRENT_VERSION) {
    const migrated = migrateData(raw);
    setRawData(migrated);
    return migrated.data;
  }

  return raw.data;
});
```

## Other Solid Primitives Worth Knowing

```typescript
// Debounced signals
import { createDebounced } from '@solid-primitives/scheduled';
const debouncedSearch = createDebounced(searchQuery, 300);

// Media queries
import { createMediaQuery } from '@solid-primitives/media';
const isDesktop = createMediaQuery('(min-width: 1024px)');

// Keyboard shortcuts
import { createShortcut } from '@solid-primitives/keyboard';
createShortcut(['Control', 'k'], () => openSearch());
```

## Key Insight

Don't reinvent wheels. Well-maintained primitives libraries have solved edge cases you haven't encountered yet. The 75% code reduction wasn't the best part—it was eliminating bugs I didn't know I had.

Rule of thumb: if you're building a "utility" that seems generally useful, search for an existing solution first. The SolidJS ecosystem has excellent primitives for most common needs.
