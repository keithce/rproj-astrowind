---
title: "Tailwind Dark Mode Implementation Strategies"
date: 2025-06-19
tags: ["tailwind", "css", "dark mode"]
description: "Today I learned about different strategies for implementing dark mode with Tailwind CSS, from class-based to media query approaches."
---

# Tailwind Dark Mode Implementation Strategies

Today I explored the different ways to implement dark mode using Tailwind CSS. The framework offers multiple strategies, each with unique advantages.

## Class-Based Dark Mode

The default approach in Tailwind is class-based, where dark mode styles are applied when a parent element has a `.dark` class:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Default in Tailwind v3+
  // ...
}
```

This requires JavaScript to toggle the class on the `html` or `body` element:

```js
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Persist in localStorage
localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
```

## Media Query-Based Dark Mode

Alternatively, you can use the user's system preference:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'media',
  // ...
}
```

With this approach, dark mode styles automatically apply when the user has enabled dark mode in their operating system.

## Custom CSS Variables Strategy

The most flexible approach combines Tailwind with CSS variables:

```css
:root {
  --background: 255, 255, 255;
  --text: 0, 0, 0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 23, 23, 23;
    --text: 255, 255, 255;
  }
}

html.dark {
  --background: 23, 23, 23;
  --text: 255, 255, 255;
}
```

Then in Tailwind:

```js
theme: {
  extend: {
    colors: {
      background: 'rgb(var(--background))',
      text: 'rgb(var(--text))'
    }
  }
}
```

This gives you both automatic system preference support and the ability to override with user preference.

The key insight I gained was that combining CSS variables with Tailwind's class-based system provides the most flexible solution for real-world applications.