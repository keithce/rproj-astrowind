---
title: 'View Transitions API: Smooth Navigation Feels Native'
date: 2026-01-04
tags: ['css', 'animation', 'ux', 'browser-apis']
description: 'Today I learned that the View Transitions API eliminates the jarring page refresh feel and makes web apps feel as smooth as native apps.'
draft: false
---

# View Transitions API: Smooth Navigation Feels Native

After years of complex JavaScript animation libraries, the View Transitions API finally makes page transitions trivial. The result feels remarkably native.

## The Problem

Traditional SPAs feel janky because:

- Content pops in abruptly
- No visual continuity between pages
- Layout shift during hydration

## The Simple Solution

```typescript
// ViewTransitionLink.tsx
export function ViewTransitionLink(props: { href: string; children: any }) {
  const navigate = useNavigate();

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();

    if (!document.startViewTransition) {
      // Fallback for unsupported browsers
      navigate(props.href);
      return;
    }

    document.startViewTransition(() => {
      navigate(props.href);
    });
  };

  return (
    <a href={props.href} onClick={handleClick}>
      {props.children}
    </a>
  );
}
```

## CSS Customization

The magic is in the CSS:

```css
/* Default crossfade */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}

/* Slide effect for specific elements */
::view-transition-old(main-content) {
  animation: slide-out 0.3s ease-out;
}

::view-transition-new(main-content) {
  animation: slide-in 0.3s ease-out;
}

@keyframes slide-out {
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

## Named Transitions for Shared Elements

The real power: morphing elements between pages:

```css
/* Give elements a shared view-transition-name */
.card-image {
  view-transition-name: hero-image;
}

/* On the detail page */
.detail-hero {
  view-transition-name: hero-image;
}
```

The browser automatically animates the element from its position on the list page to its position on the detail page. It's like magic.

## Handling Loading States

Combine with skeleton components for perceived performance:

```typescript
const PageWrapper = (props: { children: any }) => {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <div style={{ 'view-transition-name': 'main-content' }}>
        {props.children}
      </div>
    </Suspense>
  );
};
```

## Browser Support

```typescript
// Feature detection
const supportsViewTransitions = () => typeof document !== 'undefined' && 'startViewTransition' in document;

// Progressive enhancement
if (supportsViewTransitions()) {
  document.startViewTransition(() => updateDOM());
} else {
  updateDOM();
}
```

## Key Insight

The View Transitions API works by taking screenshots of the old and new states, then animating between them. This means transitions work even with complex DOM changes—no need to carefully choreograph animations.

The key insight: treat page transitions as first-class UX, not an afterthought. Users notice smooth navigation subconsciously; it makes the whole app feel more polished.
