# Best Practices for Astro + Tailwind CSS v4 + TypeScript (Astrowind)

This document outlines key best practices for developing a web application using
Astro, Tailwind CSS v4, and TypeScript, leveraging the Astrowind template. Our
focus is on ensuring maintainability, performance, security, code readability,
and consistent error handling for a small team.

## 1. Tailwind CSS v4 Best Practices

Tailwind CSS v4 introduces significant performance enhancements and a
"CSS-first" configuration approach.

Tailwind v4, with its new Lightning CSS engine, is a performance beast. The key
is to harness its power while keeping our class lists manageable and our design
system consistent.

### 1.1. The Single Source of Truth: tailwind.config.ts

Your tailwind.config.ts is the heart of the design system.

Unified Configuration: Forget postcss.config.js. Tailwind v4 handles it all.
Your config should be the only place for defining CSS-related settings. Leverage
TypeScript: Use the typed Config object from 'tailwindcss' for autocompletion
and type safety. Theme Extension: Always place customizations inside
theme.extend. This preserves Tailwind's sensible defaults while allowing you to
add your brand's colors, fonts, and spacing.

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // Add your custom design tokens here
      colors: {
        brand: {
          primary: '#0052FF', // Example primary color
          secondary: '#FFC107',
        },
      },
      fontFamily: {
        // Ensure you load these fonts in your layout
        sans: ['Inter', 'sans-serif'],
        serif: ['Source Serif Pro', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 1.2. Utility-First, with Scoped @apply for Components

For Layout & One-Offs: Use utility classes directly in your .astro or .tsx
files. This is great for component structure, spacing, and unique styles. For
Complex, Reusable Elements: For elements like buttons, cards, or form inputs
that appear frequently, avoid long, repetitive strings of utilities in the
markup. Instead, use @apply within a component's scoped <style> tag. This
improves readability and maintainability. astro--- //
src/components/ui/Button.astro

---

<button class="btn">
  <slot />
</button>

<style>
  .btn {
    @apply rounded-md bg-brand-primary px-4 py-2 text-white font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-brand-secondary;
  }
</style>

1.3. Harness CSS Variables & @theme Tailwind v4 exposes all theme values as CSS
variables (e.g., var(--tw-color-brand-primary)). This is incredibly powerful for
dynamic styling.

Use in <style> blocks: Easily access theme values for properties Tailwind
doesn't have utilities for, or for dynamic calculations. Use the @theme
directive: This is the new, clean way to access your theme values directly
within your CSS. astro

<!-- src/components/DynamicBorder.astro -->
<div class="dynamic-border">...</div>

<style>
  .dynamic-border {
    /* Old way (still works) */
    border-color: var(--tw-color-brand-primary);

    /* New, cleaner v4 way */
    border-color: theme(colors.brand.primary);
    padding: theme(spacing.4); /* Access spacing, etc. */
  }
</style>

### Performance

- **Leverage the New Oxide Engine:** Tailwind CSS v4.0's rewritten Oxide engine
  is inherently faster for both full and incremental builds. This means less
  concern about performance overhead from the CSS itself.
- **Embrace Automatic Content Detection:** V4 automatically detects your
  template files, eliminating the need for manual `content` configuration in
  `tailwind.config.js`. Ensure your project structure allows this automatic
  detection to work efficiently.
- **Utilize Unified Toolchain Benefits:** With Lightning CSS integrated,
  Tailwind v4 handles CSS minification, `@import` bundling, and vendor
  prefixing, contributing to optimized CSS output.

### Maintainability & Code Readability

- **Adopt CSS-First Configuration:** A major shift in v4 is customizing and
  extending Tailwind directly in CSS using `@property` and CSS variables instead
  of a JavaScript configuration file. Embrace this approach for theme settings,
  custom utilities, and variants.
- **Centralize Design Tokens with CSS Variables:** Tailwind CSS v4 exposes all
  your design tokens (colors, spacing, etc.) as native CSS variables by default.
  Leverage these for consistent styling and easy reuse of values directly in CSS
  or for animations.
- **Component Abstraction over Excessive `@apply`:** For common, complex UI
  patterns, abstract them into reusable Astro components (or components from
  your chosen UI framework). While `@apply` exists, the Tailwind team generally
  recommends using it sparingly to keep styles close to the markup, reducing
  repetition and improving readability.
- **Consistent Class Ordering:** Maintain a consistent order for utility classes
  within your HTML elements. Tools like Prettier with the Tailwind CSS plugin
  can automate this, significantly improving code readability and team
  consistency.
- **Composable Variants:** Explore the new composable variants feature in v4 for
  more flexible and powerful styling combinations.

## 2. Astro Best Practices

Astro's unique architecture is designed for speed and flexibility, making it
excellent for performance-critical web applications. Astrowind is built upon
these principles.

### Performance

- **Prioritize Zero JavaScript by Default (Islands Architecture):** Astro's
  "Islands Architecture" ships minimal to zero client-side JavaScript by
  default, only hydrating interactive components.
  - Use `client:load` (load on page load) only for critical interactive
    components.
  - Prefer `client:visible` (load when visible in viewport) for less critical
    interactive elements to improve initial page load.
  - Avoid over-hydrating components that don't need client-side interactivity.
- **Optimize Images and Fonts:**
  - Utilize Astro's built-in image optimization or `unpic` (as supported by
    Astrowind) to automatically compress, resize, and lazy-load images.
  - Implement font optimization techniques like `font-display: swap` and
    preloading for faster text rendering. Astrowind has an "ultra-optimized font
    setup".
- **Strategic SSR/SSG Use:** Astrowind supports static, hybrid, and server
  outputs.
  - For content-heavy pages that don't change frequently (e.g., blog posts),
    prefer Static Site Generation (SSG) for maximum performance and SEO.
  - For dynamic, user-specific, or frequently updated content, leverage
    Server-Side Rendering (SSR) or hybrid modes.
- **Leverage Code Splitting:** Astro's modular development approach enables code
  splitting by default, ensuring users only load the JavaScript necessary for
  the parts of the page they interact with.

### Maintainability & Code Readability

- **Adopt Component-Driven Development:** Organize your UI into reusable,
  self-contained Astro components. Astrowind follows the Atomic Design
  methodology (atoms, molecules, organisms, templates) for a structured
  hierarchy.
- **Follow Astro's Project Structure:** Adhere to the recommended Astro project
  structure (`src/pages`, `src/components`, `src/layouts`, `src/styles`,
  `src/assets`, `public`). This promotes consistency and makes it easier for
  team members to navigate the codebase.
  - Group similar components within `src/components` for logical organization.
  - Use an `index.ts` in component directories to export all components for
    cleaner imports.
- **Utilize Layouts:** Use Astro layouts (`src/layouts`) to define consistent
  page structures, headers, footers, and other common elements. Pass data to
  layouts via props.
- **Employ Content Collections:** For structured data like blog posts or
  documentation, use Astro's content collections. This provides schema
  validation and type safety, improving data consistency and maintainability.
- **Minimal Vanilla JavaScript:** Astrowind aims for very little vanilla
  JavaScript, which generally leads to simpler, more maintainable code, allowing
  the team to choose and integrate specific frameworks only where interactivity
  is needed.
- **Enforce Linting and Formatting:** Astrowind integrates BiomeJS for fast
  linting and formatting, and Lefthook for Git hooks. This is crucial for
  enforcing a consistent code style across the team, reducing merge conflicts,
  and improving overall readability.

### Security

- **Robust Input Validation and Sanitization:** As with any web application,
  rigorously validate and sanitize all user input on both the client and server
  sides to prevent common vulnerabilities like XSS and SQL injection.
- **Secure API Token Management:** If your application interacts with external
  APIs, store API tokens securely (e.g., in environment variables or dedicated
  secret management systems) and apply the Principle of Least Privilege. Never
  hardcode sensitive credentials.
- **Dependency Management:** Regularly update your project dependencies to patch
  known security vulnerabilities. Use tools to scan for vulnerable packages.
- **Secure Deployment Practices:** Astro's static site generation (SSG)
  inherently offers a more secure deployment model by reducing server-side
  attack surfaces. Ensure your hosting environment is also configured securely.
- **Error Handling (Security Aspect):** Avoid exposing sensitive error details
  or stack traces to end-users in production environments. Log them internally
  for debugging.

## 3. TypeScript Best Practices

TypeScript enhances code quality, maintainability, and scalability by adding
static typing to JavaScript.

### Maintainability & Code Readability

- **Enable Strict Typing:** Set `"strict": true` in your `tsconfig.json`.
  Additionally, enable strict options like `"noImplicitAny"`,
  `"strictNullChecks"`, `"strictFunctionTypes"`, and `"noUnusedLocals"`. These
  settings catch common errors early and promote cleaner, safer code.
- **Use Explicit Type Annotations Liberally:** While TypeScript can infer types,
  explicit annotations for function parameters, return values, and complex
  variables serve as clear documentation and improve code understanding for the
  team.
- **Differentiate Interfaces and Types:**
  - Use `interface` for defining object shapes, especially when you expect
    inheritance or interface merging.
  - Use `type` for unions, intersections, primitive aliases, or creating complex
    data structures where extension isn't a primary concern.
- **Modularize Your Codebase:** Divide your application into smaller, cohesive
  modules. TypeScript's module system supports this, making the codebase easier
  to manage, test, and scale.
- **Prefer Immutability:** Use `readonly` modifiers for object properties and
  `ReadonlyArray` for arrays when data should not be mutated after creation.
  This reduces side effects and common bugs.
- **Leverage Utility Types:** Use TypeScript's built-in utility types (e.g.,
  `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`) to transform existing
  types and reduce boilerplate code.
- **Implement Type Guards:** When working with `unknown` or union types, use
  type guards (e.g., `typeof`, `instanceof`, custom assertion functions) to
  safely narrow down types and prevent runtime errors.
- **Explicit Function Return Types:** Always define the return type for
  functions. This improves readability, ensures consistent behavior, and helps
  TypeScript catch errors if the function's output changes.

### Security

- **Strictly Avoid `any`:** The `any` type bypasses all TypeScript type
  checking, negating its benefits and potentially hiding security
  vulnerabilities. Use `unknown` and type guards instead to handle uncertain
  types safely.
- **Validate and Sanitize All User Input:** TypeScript's type system does _not_
  validate runtime data. Always implement robust runtime validation and
  sanitization for any user input or data from external sources, especially when
  interacting with databases or file systems.
- **Avoid Dynamic Code Execution (`eval()`):** As with JavaScript, using
  `eval()` or similar dynamic code execution methods introduces significant
  security risks. Always seek safer alternatives.
- **Secure Build Process:** Ensure your TypeScript build process is secure.
  Avoid publishing source maps in production environments, as they can expose
  your original TypeScript source code.
- **Integrate Type Checks in CI/CD:** Include `tsc --noEmit` as part of your
  Continuous Integration (CI) pipeline to automatically run type checks on every
  pull request, catching type-related issues before deployment.

### Consistent Error Handling

- **Throw `Error` Instances (or Custom Errors):** Always throw instances of the
  built-in `Error` class or, preferably, custom error classes. Avoid throwing
  raw strings, numbers, or other non-Error values, as this prevents proper stack
  traces and makes debugging difficult.
- **Use Custom Error Classes for Context:** Create specific custom error classes
  to represent distinct application-level errors (e.g., `NotFoundError`,
  `AuthenticationError`). This provides more context and allows for more
  granular error handling.
- **Enable `useUnknownInCatchVariables`:** Configure
  `useUnknownInCatchVariables` in your `tsconfig.json` to ensure `catch` block
  variables are typed as `unknown`. Always perform type checking on these
  variables (e.g., `if (error instanceof Error)`) before accessing their
  properties.
- **Implement `try-catch` for Synchronous Errors:** Use `try-catch` blocks for
  synchronous code where errors are expected (e.g., parsing user input, file
  operations).
- **Handle Asynchronous Errors with Promises/Async/Await:** For asynchronous
  operations (e.g., data fetching in server-side Astro functions or client-side
  islands), use `Promise.prototype.catch()` or `try-catch` with `async/await`
  for structured error management.
- **Consider the Result Pattern for Expected Failures:** For functions where
  failures are an expected part of the logic (e.g., a form validation failing, a
  network request timing out), consider returning a `Result` type (e.g., an
  object `{ success: true, data: T } | { success: false, error: E }`) instead of
  throwing exceptions. This makes the possibility of failure explicit in the
  type signature.
- **Centralize Error Handling:** For larger applications, implement a
  centralized error handling mechanism (e.g., an error boundary component in
  client-side frameworks, or global middleware for server-side API routes) to
  ensure consistent logging, user feedback, and error reporting.
- **Logging and Monitoring:** Implement comprehensive logging for all errors,
  including stack traces in development. In production, avoid logging sensitive
  user data directly. Integrate error monitoring tools (like Sentry) to track,
  prioritize, and fix errors in real-time.
- **Graceful Degradation:** For non-critical errors, implement fallback
  functionality or display a user-friendly message rather than crashing the
  entire application.
- **Never Ignore Errors:** Always acknowledge and handle errors, even if it's
  just logging them for future review.

---
