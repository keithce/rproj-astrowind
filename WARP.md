# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Resonant Projects .ART is a creative technology studio website built with Astro, featuring a photography portfolio, blog, and business services. This is Keith Elliott's platform for tech consulting, audio mixing & mastering, photography, and short film finishing services.

## Essential Commands

### Development

```bash
# Start development server with Notion loader debugging
pnpm dev

# Start development server (alternative)
pnpm start

# Type checking
pnpm typecheck

# Check all code quality (Astro + ESLint + Prettier)
pnpm check
```

### Build & Preview

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Build with search indexing
pnpm pagefind:build
```

### Code Quality & Formatting

```bash
# Fix ESLint and Prettier issues
pnpm fix

# Run ESLint only
pnpm lint

# Check Prettier formatting
pnpm format

# Fix ESLint issues only
pnpm fix:eslint

# Fix Prettier formatting only
pnpm fix:prettier
```

### Testing & Quality Assurance

```bash
# Run all tests (contrast, CSS vars, visual verification)
pnpm test:all

# Complete test suite (includes accessibility tests)
pnpm test:complete

# Check color contrast
pnpm test:contrast

# Validate CSS variables
pnpm validate:css

# Visual verification (headless for CI)
pnpm visual-verify:ci

# Accessibility testing
pnpm test:accessibility

# Full accessibility suite with axe-core
pnpm test:a11y:full
```

### Single Test Commands

```bash
# Run single accessibility test
pnpm test:accessibility:ci

# Test contrast with color palette
pnpm test:contrast:palette

# Visual verification with browser UI
pnpm visual-verify

# Lighthouse accessibility audit
pnpm lighthouse:accessibility
```

### Documentation

```bash
# Generate CSS documentation
pnpm docs:css
```

## Architecture Overview

### Technology Stack

- **Astro 5.x**: Static site generator with server-side rendering
- **TypeScript**: Type-safe development (strict mode disabled temporarily)
- **Tailwind CSS V4**: Utility-first CSS with modern theme system
- **React 19**: Interactive components with selective hydration
- **Vercel**: Serverless deployment with ISR support
- **Notion API**: Content management integration

### Project Structure

#### Core Configuration

- `astro.config.ts`: Main Astro configuration with server output, Vercel adapter, integrations
- `tailwind.config.js`: V4 configuration with semantic color tokens and custom animations
- `tsconfig.json`: TypeScript config with strict mode disabled, path aliases configured
- `eslint.config.js`: Flat config format with Astro, TypeScript, and React support

#### Source Organization (`src/`)

- **`config.yaml`**: Site-wide configuration (metadata, blog settings, analytics, theme)
- **`navigation.ts`**: Header/footer navigation structure and social links
- **`layouts/`**: Base layout templates (Layout, PageLayout, MarkdownLayout, LandingLayout)
- **`components/`**:
  - `widgets/`: Page-level components (Header, Footer, Hero, Contact)
  - `ui/`: Generic UI components (Button, Form, Timeline, ItemGrid)
  - `common/`: Shared utilities (Analytics, Metadata, SocialLinks)
  - `blog/`: Blog-specific components
  - `til/`: Today I Learned components with kanban view
- **`pages/`**: File-based routing with dynamic blog routing, API endpoints
- **`utils/`**: Helper functions for blog, images, permalinks, frontmatter processing
- **`assets/styles/`**: Global CSS including Tailwind V4 theme mappings

#### Key Architectural Patterns

**Semantic Design System**: Uses CSS custom properties with semantic tokens:

```css
:root {
  --color-primary: #6e2765;
  --color-background: #f1e9f0;
  --color-foreground: #160814;
}
```

**Component Composition**: Layered layouts with slot-based content projection:

- `Layout.astro` → Base HTML structure with accessibility features
- `PageLayout.astro` → Standard page layout with header/footer
- `MarkdownLayout.astro` → Content-focused layout for markdown

**Islands Architecture**: Selective hydration using Astro's client directives:

- Most components are server-rendered for performance
- React components hydrated only when interactive features needed
- Uses `client:load`, `client:idle`, `client:visible` directives strategically

### Content Management

**Notion Integration**:

- Uses `@chlorinec-pkgs/notion-astro-loader` for content loading
- Debug mode available with `DEBUG_NOTION_LOADER=1`
- Content collections defined in `src/content/config.ts`

**Blog System**:

- Full-featured blog with categories, tags, RSS feed
- Reading time calculation and table of contents generation
- Related posts and pagination support

**Search**: Client-side search powered by Pagefind

### Development Considerations

#### TypeScript Configuration

- Strict mode temporarily disabled for gradual migration
- Path aliases configured for clean imports (`~/components/*`, `~/utils/*`)
- Incremental compilation enabled for performance

#### Styling Architecture

- **Tailwind V4**: Modern configuration with `@theme` inline mappings
- **Semantic Tokens**: Centralized theme system in `CustomStyles.astro`
- **Utility Patterns**: Custom `@utility` classes for consistent components
- **Dark Mode**: CSS variables support automatic theme switching

#### Performance Optimizations

- **Zero JS by default**: Only hydrate interactive components
- **Image optimization**: Uses Astro's built-in image processing
- **Asset compression**: Configured in `astro.config.ts`
- **CDN deployment**: Vercel's edge network with maxDuration: 10s

#### Accessibility Features

- **Focus management**: Comprehensive keyboard navigation support
- **Skip links**: Accessible navigation shortcuts
- **ARIA attributes**: Proper semantic markup
- **Screen reader support**: Live regions and announcements
- **Color contrast**: Automated testing with validation scripts

### Quality Assurance

**Testing Stack**:

- **Accessibility**: Puppeteer-based testing with axe-core integration
- **Visual**: Screenshot comparison for UI consistency
- **Contrast**: WCAG compliance verification
- **CSS Variables**: Validation of theme token usage

**Code Quality**:

- **ESLint**: Flat config with Astro, TypeScript, React rules
- **Prettier**: Code formatting with Astro and Tailwind plugins
- **Type Safety**: Gradual TypeScript adoption with utility types

### Deployment

**Vercel Configuration**:

- Server-side rendering with ISR disabled
- Web Analytics enabled
- Redis session storage (URL from environment)
- Serverless functions with 10s timeout

**Environment Variables**:

- `REDIS_URL`: Session storage
- Google Analytics ID configured in `src/config.yaml`
- Notion API credentials for content management

### Development Workflow

1. **Setup**: `pnpm install` to install dependencies
2. **Development**: `pnpm dev` for hot reloading with Notion debugging
3. **Quality**: `pnpm check` before commits to ensure code quality
4. **Testing**: `pnpm test:all` for comprehensive validation
5. **Build**: `pnpm build` for production optimization

### Common Patterns

**Component Props Typing**:

```typescript
export interface Props {
  metadata?: MetaData;
  class?: string;
}
```

**Utility Imports**:

```typescript
import { twMerge } from 'tailwind-merge';
import { Icon } from 'astro-icon/components';
```

**Content Collection Usage**:

```typescript
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
```

This architecture prioritizes performance, maintainability, and accessibility while providing a flexible foundation for Keith Elliott's creative technology services.
