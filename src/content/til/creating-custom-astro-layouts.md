---
title: "Creating Custom Astro Layouts"
date: 2025-06-20
tags: ["astro", "web development", "layouts"]
description: "Today I learned how to create custom layouts in Astro to reuse page structures while passing specific metadata."
draft: false
---

# Creating Custom Astro Layouts

One of the most powerful features in Astro is the ability to create reusable layout components that can be applied across multiple pages.

## The Basic Structure

```astro
---
// src/layouts/CustomLayout.astro
const { title, description } = Astro.props;
---

<html>
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <header>Common Header</header>
    <main>
      <slot />
    </main>
    <footer>Common Footer</footer>
  </body>
</html>
```

## Using the Layout

```astro
---
// src/pages/example.astro
import CustomLayout from '../layouts/CustomLayout.astro';
---

<CustomLayout title="Page Title" description="Page description">
  <p>This content will be injected into the slot</p>
</CustomLayout>
```

The key insight I gained today is that layouts in Astro can receive props just like any other component, making them incredibly flexible for managing page-specific metadata while maintaining consistent structure.

## Named Slots

You can also use named slots for more complex layouts:

```astro
<slot name="header" />
<main>
  <slot /> <!-- default slot -->
</main>
<slot name="footer" />
```

This approach has significantly improved my workflow by reducing duplication across pages.