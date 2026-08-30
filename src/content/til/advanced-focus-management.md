---
title: 'Advanced Focus Management for Accessibility'
date: 2024-12-05
tags: ['accessibility', 'javascript', 'focus', 'keyboard']
description: 'Today I learned how to build a comprehensive focus management system with modal trapping, roving tabindex, and grid navigation patterns.'
draft: false
---

# Advanced Focus Management for Accessibility

Keyboard users rely on predictable focus behavior. I built a FocusManager class that handles complex patterns like modal focus trapping, roving tabindex, and grid navigation.

## Focus Trapping for Modals

Trap focus inside a modal, supporting nested modals:

```javascript
class FocusManager {
  constructor() {
    this.modalStack = [];
    this.lastFocus = null;
  }

  trapFocus(container) {
    this.lastFocus = document.activeElement;
    this.modalStack.push(container);

    const focusables = this.getFocusableElements(container);
    if (focusables.length) focusables[0].focus();

    container.addEventListener('keydown', this.handleTabKey);
  }

  releaseFocus() {
    const container = this.modalStack.pop();
    container?.removeEventListener('keydown', this.handleTabKey);
    this.lastFocus?.focus();
  }

  handleTabKey = e => {
    if (e.key !== 'Tab') return;

    const container = this.modalStack.at(-1);
    const focusables = this.getFocusableElements(container);
    const first = focusables[0];
    const last = focusables.at(-1);

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
}
```

## Roving Tabindex

Move focus between siblings with arrow keys:

```javascript
initRovingTabindex(container) {
  const items = container.querySelectorAll('[data-roving-item]');
  items.forEach((item, i) => {
    item.tabIndex = i === 0 ? 0 : -1;
  });

  container.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    const items = [...container.querySelectorAll('[data-roving-item]')];
    const current = items.findIndex(el => el === document.activeElement);
    const next = e.key === 'ArrowRight'
      ? (current + 1) % items.length
      : (current - 1 + items.length) % items.length;

    items[current].tabIndex = -1;
    items[next].tabIndex = 0;
    items[next].focus();
  });
}
```

## Grid Navigation

Arrow keys navigate a 2D grid:

```javascript
initGridNavigation(container, columns) {
  container.addEventListener('keydown', (e) => {
    const cells = [...container.querySelectorAll('[role="gridcell"]')];
    const current = cells.findIndex(c => c === document.activeElement);

    let next;
    switch (e.key) {
      case 'ArrowRight': next = current + 1; break;
      case 'ArrowLeft': next = current - 1; break;
      case 'ArrowDown': next = current + columns; break;
      case 'ArrowUp': next = current - columns; break;
      default: return;
    }

    if (next >= 0 && next < cells.length) {
      e.preventDefault();
      cells[next].focus();
    }
  });
}
```

## Auto-Focus for Dynamic Content

Focus the first interactive element when new content loads:

```html
<div data-auto-focus data-announce="New content loaded">
  <button data-focus-target>First action</button>
</div>
```

```javascript
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.hasAttribute?.('data-auto-focus')) {
        const target = node.querySelector('[data-focus-target]');
        target?.focus();
        announce(node.dataset.announce);
      }
    });
  });
});
```

## Key Insight

Focus management is about predictability. Users should know where focus goes when they open a modal, close a dialog, or navigate a grid. The patterns are consistent: trap focus in modals, restore focus on close, use roving tabindex for component navigation, and announce dynamic changes to screen readers.
