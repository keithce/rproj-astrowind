# Astro Web Application Best Practices

This document outlines best practices for developing web applications using Astro, TypeScript, and related technologies, focusing on maintainability, performance, security, code readability, and consistent error handling.

## Table of Contents

1.  [Project Structure & Organization](#project-structure--organization)
2.  [TypeScript Usage](#typescript-usage)
3.  [Component Development (Astro & React)](#component-development-astro--react)
4.  [Styling (Tailwind CSS)](#styling-tailwind-css)
5.  [Data Handling & Validation (Zod, Notion API)](#data-handling--validation-zod-notion-api)
6.  [Performance Optimization](#performance-optimization)
7.  [Security](#security)
8.  [Error Handling](#error-handling)
9.  [Deployment (Vercel)](#deployment-vercel)
10. [Tooling & Code Quality](#tooling--code-quality)

## 1. Project Structure & Organization

- **Follow Astro's Recommended Project Structure**: Utilize the standard `src/pages`, `src/layouts`, `src/components`, `src/assets`, and `public` directories. [25]
- **Modular Components**: Break down UI into small, reusable components. [8, 31]
  - Consider Atomic Design principles (atoms, molecules, organisms, templates) for structuring components, especially for larger applications. [31]
- **Organize by Feature/Domain**: For larger projects, consider grouping related components, pages, and utilities by feature or domain to improve discoverability and maintainability.
- **Utility Directory**: Create a `src/lib` or `src/utils` directory for shared logic, helper functions, and constants. [39]
- **Type Definitions**: Store custom type definitions in a dedicated `src/types` directory or within relevant feature/component directories. [14, 39]
- **Configuration Files**: Keep configuration files (e.g., `astro.config.mjs`, `tailwind.config.cjs`, `tsconfig.json`) at the project root. [25, 39]
- **Barrel Exports (`index.ts`)**: Use `index.ts` files within directories to simplify import paths for modules and components. [39]
- **Path Aliases**: Configure path aliases in `tsconfig.json` (and `astro.config.mjs` if needed) for cleaner import statements (e.g., `@components/`, `@lib/`). [39]

## 2. TypeScript Usage

- **Enable Strict Mode**: In your `tsconfig.json`, set `"strict": true` to enable all strict type-checking options. [2, 3, 4, 16, 21, 27] This includes:
  - `"noImplicitAny": true` [4, 16]
  - `"strictNullChecks": true` [4, 16]
  - `"strictFunctionTypes": true` [4, 30]
  - `"strictPropertyInitialization": true` [16]
- **Type Everything**:
  - **Component Props**: Always define interfaces or types for your component props in both Astro and React components. [14, 40]
  - **Function Parameters and Return Types**: Explicitly type function parameters and return values. [4, 5, 13, 17, 30] This improves predictability and helps catch errors. [4]
  - **Variables and Constants**: Use type annotations, though leverage type inference where it's clear and doesn't sacrifice readability. [5, 9]
- **Avoid `any`**: Minimize the use of `any`. Prefer `unknown` for values whose type is genuinely unknown and use type guards to narrow down the type. [1, 7, 16, 17, 21, 26]
- **Use Interfaces for Object Shapes**: Prefer interfaces over type aliases for defining the shape of objects, especially when you expect them to be extended or implemented. [4, 6, 13, 30]
- **Utility Types**: Leverage TypeScript's built-in utility types like `Partial<T>`, `Readonly<T>`, `Pick<T, K>`, `Omit<T, K>` to create new types from existing ones concisely. [1, 4, 9, 17, 28]
- **Enums for Named Constants**: Use enums for sets of named constants to improve readability and maintainability. [2, 3, 6]
- **Consistent Naming Conventions**:
  - `PascalCase` for types, interfaces, enums, and class names. [5, 6]
  - `camelCase` for variables, function names, and interface members. [5, 6]
- **Readonly and Immutability**: Use `readonly` modifiers and `ReadonlyArray<T>` where appropriate to promote immutability and prevent accidental modifications. [17, 26]
- **Type Guards**: Implement type guards for runtime type checking, especially when dealing with external data or unions. [17]
- **Astro's `HTMLAttributes`**: Use Astro's `HTMLAttributes` type for prop validation against standard HTML attributes. [40]

## 3. Component Development (Astro & React)

- **Astro Components (`.astro`)**:
  - Keep component logic in the frontmatter script section.
  - Use scoped styles (`<style>`) by default for encapsulation. [25]
  - Leverage Astro's partial hydration directives (`client:load`, `client:idle`, `client:visible`, `client:media`, `client:only`) judiciously to ship minimal JavaScript. [8, 29, 41] Over-hydration negates performance benefits. [8]
- **React Components (`.tsx`)**:
  - Use functional components with Hooks.
  - Ensure React components are hydrated only when necessary using Astro's client directives.
  - Follow React best practices for state management, side effects, and component composition.
- **Props**:
  - Clearly define and type component props. [14, 40]
  - Use descriptive prop names.
- **Slots (Astro)**: Utilize slots for content projection and creating flexible layouts.
- **Accessibility (A11y)**:
  - Use semantic HTML. [33]
  - Implement ARIA attributes where necessary. [33]
  - Ensure keyboard navigability for interactive elements. [33]
  - Consider `prefers-reduced-motion` for animations. [31]

## 4. Styling (Tailwind CSS)

- **Utility-First**: Embrace Tailwind's utility-first approach for styling directly in your markup. [33]
- **Configuration (`tailwind.config.cjs`)**:
  - Customize your theme (colors, spacing, fonts) in `tailwind.config.cjs` to maintain consistency. [33]
  - Use `theme.extend` for adding custom utilities or overriding defaults.
- **Readability**:
  - Group related utility classes for better readability.
  - Consider using Prettier plugins for Tailwind CSS to automatically sort classes.
- **Component Classes**: For complex or frequently reused combinations of utilities, consider extracting them into component classes using Tailwind's `@apply` directive _sparingly_ within global CSS or component-specific style blocks. Be mindful that overuse of `@apply` can negate some of Tailwind's benefits. [33]
- **Purging**: Ensure Tailwind CSS is configured to purge unused styles in production builds (Astro handles this well by default with the Tailwind integration).
- **Global Styles**: Use a global CSS file (e.g., `src/styles/global.css`) for base styles, CSS variables, and font imports. [25]

## 5. Data Handling & Validation (Zod, Notion API)

- **Zod for Validation**:
  - Define Zod schemas for all external data sources (Notion API, form submissions, etc.) to ensure data integrity. [15, 21]
  - Use Zod schemas to validate API responses and request payloads.
  - Keep Zod schemas modular and reusable. [15]
  - Parse data at the boundaries of your application (e.g., when fetching data or receiving user input).
- **Notion API Interaction**:
  - Create dedicated modules or services for interacting with the Notion API.
  - Type API responses using Zod schemas.
  - Handle API rate limits and errors gracefully (e.g., with retries and exponential backoff if appropriate). [11]
  - Store API keys and sensitive credentials securely using environment variables (see Security section). [21, 24, 35]
- **Data Fetching in Astro**:
  - Use `Astro.glob()` for local file data. [14, 33]
  - Fetch data in component frontmatter for server-rendered pages.
  - For dynamic client-side data, fetch within React components or use client-side scripts.
- **Type Safety with Fetched Data**: Ensure fetched data is correctly typed, ideally inferred from Zod schemas.

## 6. Performance Optimization

- **Astro's Strengths**:
  - **Zero JS by Default**: Astro ships minimal to no JavaScript by default. [34]
  - **Partial Hydration**: Only hydrate interactive components when necessary. [8, 29, 41] Avoid over-hydrating. [8]
  - **SSG/SSR**: Leverage Astro's ability to pre-render pages to static HTML (SSG) or render on demand (SSR) for fast load times. [8, 29]
- **Image Optimization**:
  - Use Astro's built-in `<Image />` component or `@astrojs/image` integration for optimized images (responsive sizes, modern formats like WebP, lazy loading). [8, 19, 33, 34]
- **Asset Management**:
  - Place static assets that don't need processing in the `public/` directory. [25]
  - Place assets that need processing (e.g., images to be optimized, global CSS) in `src/assets/` or `src/styles/`. [25]
- **Code Splitting**: Astro performs code splitting automatically. [8, 19]
- **Minimize JavaScript**:
  - Only use client-side JavaScript where interactivity is essential.
  - Defer loading of non-critical scripts. [8, 19]
- **CSS Optimization**:
  - Tailwind CSS with its purging capabilities helps keep CSS bundle sizes small.
  - Astro can inline critical CSS. [19]
- **Font Optimization**:
  - Use `font-display: swap` for custom fonts. [8, 19]
  - Consider preloading critical fonts. [31]
- **Lazy Loading**: Lazy load images and other non-critical resources. [19, 34]
- **Caching**: Leverage Vercel's CDN and caching capabilities.
- **Bundle Analysis**: Periodically analyze your bundle sizes to identify potential bloat.
- **TypeScript Compilation Performance**:
  - Prefer interfaces over complex intersection types where possible. [13, 30]
  - Add explicit type annotations, especially for return types, to reduce compiler work. [13, 30]
  - Configure `tsconfig.json` appropriately (e.g., `skipLibCheck` can speed up builds but use with caution). [30]
  - Use incremental builds (`"incremental": true` in `tsconfig.json`). [13, 28]

## 7. Security

- **Environment Variables**:
  - Store all sensitive information (API keys, secrets) in environment variables. [21, 24, 35]
  - Use Vercel's environment variable management for production.
  - Do _not_ commit `.env` files containing actual secrets to version control. Use `.env.example` as a template.
- **Input Validation**:
  - Validate **all** user input and data from external sources (e.g., Notion API, Resend webhooks) using Zod. [7, 16, 21] This helps prevent injection attacks and ensures data integrity.
- **Cross-Site Scripting (XSS) Prevention**:
  - Astro's templating and UI frameworks like React generally provide good XSS protection by default by escaping content.
  - Be cautious when using `set:html` in Astro or `dangerouslySetInnerHTML` in React. Sanitize any user-provided content before rendering it this way.
- **API Security (Notion, Resend)**:
  - Use HTTPS for all API requests. [21]
  - Follow the principle of least privilege for API tokens. Grant only necessary permissions. [11, 35]
  - Securely store and transmit API tokens. [11, 24, 35]
- **Dependency Management**:
  - Keep dependencies (npm packages) up-to-date to patch known vulnerabilities. [7, 21]
  - Use tools like `npm audit` or Snyk to check for vulnerabilities. [7]
- **Content Security Policy (CSP)**: Consider implementing a CSP to mitigate XSS and other injection attacks. [7]
- **Vercel Security**:
  - Utilize Vercel's built-in security features (e.g., DDoS protection, automatic HTTPS).
- **Avoid `eval()` and Dynamic Code Execution**: Do not use `eval()` or similar functions with untrusted input. [7]
- **Secure Build Process**: Ensure your build process doesn't introduce vulnerabilities. Avoid publishing source maps in production if they reveal sensitive original code. [7]

## 8. Error Handling

- **Consistent Error Handling Strategy**: Define a consistent approach for handling errors throughout the application.
- **Zod for Validation Errors**: Use Zod's error reporting to provide meaningful validation error messages to the user or for logging. [15]
- **API Error Handling**:
  - Gracefully handle errors from the Notion API and Resend (e.g., network issues, rate limits, invalid requests). [11, 35]
  - Provide clear feedback to the user when API operations fail.
  - Log detailed error information for debugging. [15]
- **Try-Catch Blocks**: Use `try...catch` blocks for operations that can throw errors, especially asynchronous operations. [3]
- **Custom Error Pages (Astro)**: Create custom error pages (e.g., `404.astro`, `500.astro`) for a better user experience.
- **Client-Side Error Handling (React)**:
  - Use Error Boundaries in React to catch JavaScript errors in component trees and display a fallback UI.
- **Meaningful Error Messages**: Provide clear, user-friendly error messages that help users understand what went wrong and how to proceed. [15]
- **Logging**:
  - Implement server-side logging (e.g., via Vercel Functions if used for backend logic) for errors and important events.
  - Log validation errors for debugging. [15]
  - Avoid logging sensitive information in error messages. [21]
- **Separate Validation and Runtime Errors**: Handle data validation errors differently from unexpected runtime errors. [15]

## 9. Deployment (Vercel)

- **Connect Git Repository**: Connect your Git repository (GitHub, GitLab, Bitbucket) to Vercel for automatic deployments.
- **Environment Variables**: Configure production environment variables securely in Vercel's project settings.
- **Build Configuration**: Ensure Vercel's build settings are correctly configured for your Astro project.
- **Preview Deployments**: Utilize Vercel's preview deployments for every Git push to test changes before merging to production.
- **Custom Domains**: Configure custom domains as needed.
- **Monitoring**: Use Vercel's analytics and logging to monitor application health and performance.

## 10. Tooling & Code Quality

- **Linters and Formatters**:
  - Use ESLint for JavaScript/TypeScript linting. [2, 36]
  - Use Prettier for code formatting. [2, 36]
  - Integrate these tools into your development workflow (e.g., pre-commit hooks, editor integration). [31, 36]
- **Astro VS Code Extension**: Use the official Astro VS Code extension for optimal editor support (syntax highlighting, TypeScript integration, autocompletion). [40]
- **TypeScript Compiler (`tsc`)**: Use `astro check` or `tsc --noEmit` as part of your CI/CD pipeline or pre-commit hooks to catch type errors. [40]
- **Git Hooks**: Use tools like Lefthook or Husky to run linters, formatters, and tests before committing/pushing code. [31]
- **Code Reviews**: Conduct regular code reviews to ensure adherence to best practices, improve code quality, and share knowledge. [2]
- **Testing**:
  - Write unit tests for utility functions and complex logic. [9, 17, 33]
  - Consider end-to-end tests (e.g., using Playwright or Cypress) for critical user flows. [31, 33]

By adhering to these best practices, your team can build a maintainable, performant, secure, and readable Astro web application. Remember that these are guidelines, and you may need to adapt them based on your project's specific evolving needs.
