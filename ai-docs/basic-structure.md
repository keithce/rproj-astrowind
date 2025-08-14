# Project Basic Structure

## Overview

This is an Astro-based web application for Resonant Projects, featuring a
photography portfolio, blog, and business services. The project uses TypeScript,
Tailwind CSS, React components, and server-side rendering with Vercel
deployment.

## Root Configuration Files

### Core Configuration

- **`astro.config.ts`** - Main Astro configuration with integrations, build
  settings, and adapter configuration
- **`package.json`** - Project dependencies and scripts
- **`tsconfig.json`** - TypeScript compiler configuration
- **`tailwind.config.js`** - Tailwind CSS customization and theme configuration

### Build & Deployment

- **`vercel.json`** - Vercel deployment configuration
- **`eslint.config.js`** - ESLint rules and code quality settings
- **`starwind.config.json`** - Custom theme configuration file

## Source Directory (`src/`)

### Core Application Files

- **`config.yaml`** - Site-wide configuration including metadata, blog settings,
  analytics, and UI theme
- **`navigation.ts`** - Navigation menu structure and routing definitions
- **`types.d.ts`** - Global TypeScript type definitions
- **`env.d.ts`** - Environment variable type definitions

### Assets (`src/assets/`)

Static assets organized by type:

- **`images/`** - Application images, logos, and graphics
- **`styles/`** - Global CSS files including Tailwind and custom styles
- **`favicons/`** - Site favicon variations

### Components (`src/components/`)

Reusable UI components organized by function:

- **`blog/`** - Blog-specific components (Grid, Pagination, Tags, etc.)
- **`common/`** - Shared components (Analytics, Metadata, SocialLinks, etc.)
- **`ui/`** - Generic UI components (Button, Form, Timeline, etc.)
- **`widgets/`** - Page-level components (Hero, Contact, Features, etc.)
- **`starwind/`** - Custom component library
- **`CustomStyles.astro`** - Global CSS variables and theme definitions
- **`Logo.astro`** - Site logo component
- **`Favicons.astro`** - Favicon management component

### Layouts (`src/layouts/`)

Page layout templates:

- **`Layout.astro`** - Base layout with head, navigation, and footer
- **`PageLayout.astro`** - Standard page layout for static content
- **`MarkdownLayout.astro`** - Layout for markdown content
- **`LandingLayout.astro`** - Specialized layout for landing pages

### Pages (`src/pages/`)

Route definitions and page components:

- **`index.astro`** - Homepage
- **`about.astro`** - About page
- **`contact.astro`** - Contact page
- **`services.astro`** - Services overview
- **`pricing.astro`** - Pricing information
- **`404.astro`** - Error page
- **`services/`** - Individual service pages (color, design, motion, rhythm)
- **`[...blog]/`** - Dynamic blog routing
- **`landing/`** - Landing page variants
- **`homes/`** - Homepage variants
- **`api/`** - API endpoints
- **`rss.xml.ts`** - RSS feed generation
- **`privacy.md`** - Privacy policy
- **`terms.md`** - Terms of service

### Content (`src/content/`)

Content collections and configuration:

- **`config.ts`** - Content collection schemas and validation

### Data (`src/data/`)

Static data files:

- **`post/`** - Blog post data and images

### Utilities (`src/utils/`)

Helper functions and utilities:

- **`blog.ts`** - Blog-related utilities
- **`images.ts`** - Image processing utilities
- **`utils.ts`** - General utility functions
- **`pagefind.ts`** - Search functionality
- **`frontmatter.ts`** - Markdown processing plugins

## Public Directory (`public/`)

Static assets served directly:

- **`images/`** - Portfolio and content images
- **`robots.txt`** - Search engine crawling rules
- **`_headers`** - HTTP headers configuration
- **`decapcms/`** - CMS configuration for content management

## Scripts Directory (`scripts/`)

Build and development utilities:

- **`contrast-checker.js`** - Accessibility contrast validation
- **`css-variable-validator.js`** - CSS variable validation
- **`generate-css-docs.js`** - CSS documentation generation
- **`visual-verification.js`** - Visual testing utilities

## Vendor Directory (`vendor/`)

Custom integrations:

- **`integration/`** - Custom Astro integration for theme configuration
- **`README.md`** - Integration documentation

## Documentation (`docs/`)

Project documentation:

- **`best-practices.md`** - Development best practices
- **`tailwind-v4-migration-guide.md`** - Tailwind CSS v4 migration guide
- **`css-variable-migration-report.md`** - CSS variable migration documentation

## Key Features

### Technology Stack

- **Astro** - Static site generator with islands architecture
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React** - Interactive components
- **MDX** - Enhanced markdown support

### Integrations

- **Vercel** - Serverless deployment with ISR support
- **Partytown** - Web worker for third-party scripts
- **Sitemap** - Automatic sitemap generation
- **Icon** - SVG icon management
- **Compression** - Asset optimization

### Content Management

- **DecapCMS** - Git-based content management
- **Content Collections** - Type-safe content handling
- **Blog System** - Full-featured blog with categories and tags
- **RSS Feed** - Automatic feed generation

### Development Tools

- **ESLint** - Code quality enforcement
- **Prettier** - Code formatting
- **Pagefind** - Client-side search
- **Analytics** - Google Analytics integration
