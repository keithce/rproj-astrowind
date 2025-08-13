#!/usr/bin/env node

/**
 * CSS Variable Documentation Generator
 *
 * This script automatically generates comprehensive documentation for all CSS variables
 * including usage examples, color swatches, and theme comparisons.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSS Variable definitions with descriptions
const VARIABLE_DEFINITIONS = {
  brand: {
    title: 'Brand Colors',
    description: 'Core brand color palette with 11 shades from lightest to darkest',
    variables: {
      '--color-brand-50': {
        description: 'Lightest brand color, used for subtle backgrounds',
        usage: 'Backgrounds, cards',
      },
      '--color-brand-100': {
        description: 'Very light brand color, used for text on dark backgrounds',
        usage: 'Text on dark themes',
      },
      '--color-brand-200': {
        description: 'Light brand color, used for borders and inputs',
        usage: 'Borders, input backgrounds',
      },
      '--color-brand-300': {
        description: 'Medium-light brand color, used for accents in dark theme',
        usage: 'Dark theme accents, outlines',
      },
      '--color-brand-400': {
        description: 'Medium brand color, used for secondary elements',
        usage: 'Secondary buttons, muted text',
      },
      '--color-brand-500': {
        description: 'Core brand color, primary accent',
        usage: 'Primary accents, outlines',
      },
      '--color-brand-600': {
        description: 'Medium-dark brand color, primary buttons',
        usage: 'Primary buttons, links',
      },
      '--color-brand-700': {
        description: 'Dark brand color, used for text',
        usage: 'Text, headings',
      },
      '--color-brand-800': {
        description: 'Very dark brand color, body text',
        usage: 'Body text, default text',
      },
      '--color-brand-900': {
        description: 'Darkest brand color, high contrast text',
        usage: 'High contrast text, dark backgrounds',
      },
      '--color-brand-950': {
        description: 'Deepest brand color, dark theme backgrounds',
        usage: 'Dark theme backgrounds',
      },
    },
  },
  semantic: {
    title: 'Semantic Colors',
    description: 'Theme-aware semantic colors that adapt to light/dark modes',
    variables: {
      '--color-background': {
        description: 'Main page background color',
        usage: 'Page backgrounds, main content areas',
      },
      '--color-foreground': { description: 'Primary text color', usage: 'Headings, primary text' },
      '--color-card': {
        description: 'Card background color',
        usage: 'Card components, elevated surfaces',
      },
      '--color-card-foreground': {
        description: 'Text color on cards',
        usage: 'Text within card components',
      },
      '--color-popover': {
        description: 'Popover background color',
        usage: 'Tooltips, dropdowns, modals',
      },
      '--color-popover-foreground': {
        description: 'Text color in popovers',
        usage: 'Text in tooltips and dropdowns',
      },
      '--color-primary': {
        description: 'Primary action color',
        usage: 'Primary buttons, key actions',
      },
      '--color-primary-foreground': {
        description: 'Text color on primary elements',
        usage: 'Text on primary buttons',
      },
      '--color-secondary': {
        description: 'Secondary action color',
        usage: 'Secondary buttons, less important actions',
      },
      '--color-secondary-foreground': {
        description: 'Text color on secondary elements',
        usage: 'Text on secondary buttons',
      },
      '--color-muted': {
        description: 'Muted background color',
        usage: 'Disabled states, subtle backgrounds',
      },
      '--color-muted-foreground': {
        description: 'Muted text color',
        usage: 'Secondary text, captions',
      },
      '--color-accent': {
        description: 'Accent color for highlights',
        usage: 'Highlights, badges, notifications',
      },
      '--color-accent-foreground': {
        description: 'Text color on accent elements',
        usage: 'Text on highlighted elements',
      },
      '--color-border': {
        description: 'Default border color',
        usage: 'Component borders, dividers',
      },
      '--color-input': { description: 'Input field background', usage: 'Form inputs, text areas' },
      '--color-outline': {
        description: 'Focus outline color',
        usage: 'Focus states, accessibility outlines',
      },
      '--color-ring': {
        description: 'Focus ring color',
        usage: 'Focus rings, selection indicators',
      },
    },
  },
  status: {
    title: 'Status Colors',
    description: 'Colors for different states and feedback messages',
    variables: {
      '--color-info': {
        description: 'Information message color',
        usage: 'Info alerts, informational content',
      },
      '--color-info-foreground': {
        description: 'Text color for info messages',
        usage: 'Text in info alerts',
      },
      '--color-success': {
        description: 'Success message color',
        usage: 'Success alerts, positive feedback',
      },
      '--color-success-foreground': {
        description: 'Text color for success messages',
        usage: 'Text in success alerts',
      },
      '--color-warning': {
        description: 'Warning message color',
        usage: 'Warning alerts, caution indicators',
      },
      '--color-warning-foreground': {
        description: 'Text color for warning messages',
        usage: 'Text in warning alerts',
      },
      '--color-error': {
        description: 'Error message color',
        usage: 'Error alerts, validation errors',
      },
      '--color-error-foreground': {
        description: 'Text color for error messages',
        usage: 'Text in error alerts',
      },
    },
  },
  legacy: {
    title: 'Legacy Variables',
    description: 'Backward compatibility variables for existing AstroWind components',
    variables: {
      '--aw-font-sans': { description: 'Sans-serif font family', usage: 'Body text, UI elements' },
      '--aw-font-serif': { description: 'Serif font family', usage: 'Headings, decorative text' },
      '--aw-font-heading': { description: 'Heading font family', usage: 'All heading elements' },
      '--aw-color-primary': { description: 'Legacy primary color', usage: 'Existing components' },
      '--aw-color-secondary': {
        description: 'Legacy secondary color',
        usage: 'Existing components',
      },
      '--aw-color-accent': { description: 'Legacy accent color', usage: 'Existing components' },
      '--aw-color-text-heading': {
        description: 'Legacy heading text color',
        usage: 'Existing headings',
      },
      '--aw-color-text-default': {
        description: 'Legacy default text color',
        usage: 'Existing text elements',
      },
      '--aw-color-text-muted': {
        description: 'Legacy muted text color',
        usage: 'Existing secondary text',
      },
      '--aw-color-text-page': {
        description: 'Legacy page text color',
        usage: 'Existing page content',
      },
      '--aw-color-bg-page': {
        description: 'Legacy page background color',
        usage: 'Existing page backgrounds',
      },
      '--aw-color-bg-page-dark': {
        description: 'Legacy dark page background',
        usage: 'Existing dark theme backgrounds',
      },
    },
  },
};

class CSSDocumentationGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../docs/css-variables');
  }

  /**
   * Generate color swatch HTML
   */
  generateColorSwatch(variable, value) {
    return `
      <div class="color-swatch">
        <div class="color-preview" style="background-color: ${value};" title="${value}"></div>
        <div class="color-info">
          <code>${variable}</code>
          <span class="color-value">${value}</span>
        </div>
      </div>
    `;
  }

  /**
   * Generate usage example
   */
  generateUsageExample(variable, description, usage) {
    return `
      <div class="usage-example">
        <h4>Usage Example</h4>
        <div class="example-code">
          <pre><code>.my-component {
  background-color: var(${variable});
  /* ${description} */
}</code></pre>
        </div>
        <div class="example-usage">
          <strong>Common uses:</strong> ${usage}
        </div>
      </div>
    `;
  }

  /**
   * Generate theme comparison table
   */
  generateThemeComparison(variables) {
    const lightValues = {
      '--color-brand-50': '#faf9fb',
      '--color-brand-100': '#f0e8ee',
      '--color-brand-200': '#e2d4e0',
      '--color-brand-300': '#c4a1bf',
      '--color-brand-400': '#a87da3',
      '--color-brand-500': '#7e3775',
      '--color-brand-600': '#6e2765',
      '--color-brand-700': '#4a2c46',
      '--color-brand-800': '#3a1e36',
      '--color-brand-900': '#2c1028',
      '--color-brand-950': '#160814',
    };

    const darkValues = {
      '--color-background': '#160814',
      '--color-foreground': '#f0e8ee',
      '--color-primary': '#c4a1bf',
      '--color-secondary': '#6e2765',
      '--color-muted': '#3a1e36',
      '--color-border': '#3a1e36',
    };

    return `
      <div class="theme-comparison">
        <h3>Theme Comparison</h3>
        <div class="comparison-grid">
          <div class="theme-column">
            <h4>Light Theme</h4>
            ${Object.entries(variables)
              .map(([variable]) => {
                const value = lightValues[variable] || 'var(' + variable + ')';
                return this.generateColorSwatch(variable, value);
              })
              .join('')}
          </div>
          <div class="theme-column">
            <h4>Dark Theme</h4>
            ${Object.entries(variables)
              .map(([variable]) => {
                const value =
                  darkValues[variable] || lightValues[variable] || 'var(' + variable + ')';
                return this.generateColorSwatch(variable, value);
              })
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate complete documentation
   */
  generateDocumentation() {
    const currentDate = new Date().toLocaleDateString();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Variables Documentation</title>
  <style>
    :root {
      --color-brand-50: #faf9fb;
      --color-brand-100: #f0e8ee;
      --color-brand-200: #e2d4e0;
      --color-brand-300: #c4a1bf;
      --color-brand-400: #a87da3;
      --color-brand-500: #7e3775;
      --color-brand-600: #6e2765;
      --color-brand-700: #4a2c46;
      --color-brand-800: #3a1e36;
      --color-brand-900: #2c1028;
      --color-brand-950: #160814;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 2rem;
      background: var(--color-brand-50);
      color: var(--color-brand-900);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--color-brand-200);
    }

    .header h1 {
      color: var(--color-brand-600);
      margin-bottom: 0.5rem;
    }

    .header .subtitle {
      color: var(--color-brand-700);
      font-size: 1.1rem;
    }

    .section {
      margin-bottom: 3rem;
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section h2 {
      color: var(--color-brand-600);
      border-bottom: 2px solid var(--color-brand-200);
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .variable-grid {
      display: grid;
      gap: 1.5rem;
    }

    .variable-item {
      border: 1px solid var(--color-brand-200);
      border-radius: 0.5rem;
      padding: 1.5rem;
      background: var(--color-brand-50);
    }

    .variable-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .variable-name {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 1.1rem;
      font-weight: bold;
      color: var(--color-brand-600);
      background: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      border: 1px solid var(--color-brand-300);
    }

    .color-swatch {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
    }

    .color-preview {
      width: 60px;
      height: 60px;
      border-radius: 0.5rem;
      border: 2px solid var(--color-brand-300);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .color-info code {
      display: block;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9rem;
      color: var(--color-brand-700);
    }

    .color-value {
      font-size: 0.8rem;
      color: var(--color-brand-600);
      font-family: monospace;
    }

    .variable-description {
      color: var(--color-brand-700);
      margin-bottom: 1rem;
    }

    .usage-example {
      background: var(--color-brand-100);
      padding: 1rem;
      border-radius: 0.25rem;
      margin-top: 1rem;
    }

    .usage-example h4 {
      margin: 0 0 0.5rem 0;
      color: var(--color-brand-600);
    }

    .example-code {
      background: var(--color-brand-900);
      color: var(--color-brand-100);
      padding: 1rem;
      border-radius: 0.25rem;
      margin: 0.5rem 0;
      overflow-x: auto;
    }

    .example-code pre {
      margin: 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9rem;
    }

    .example-usage {
      font-size: 0.9rem;
      color: var(--color-brand-700);
    }

    .theme-comparison {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--color-brand-100);
      border-radius: 0.5rem;
    }

    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 1rem;
    }

    .theme-column h4 {
      text-align: center;
      color: var(--color-brand-600);
      margin-bottom: 1rem;
    }

    .toc {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toc h3 {
      margin-top: 0;
      color: var(--color-brand-600);
    }

    .toc ul {
      list-style: none;
      padding: 0;
    }

    .toc li {
      margin: 0.5rem 0;
    }

    .toc a {
      color: var(--color-brand-600);
      text-decoration: none;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s;
    }

    .toc a:hover {
      background: var(--color-brand-100);
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .stat-card {
      background: var(--color-brand-600);
      color: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      display: block;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      body { padding: 1rem; }
      .comparison-grid { grid-template-columns: 1fr; }
      .color-swatch { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CSS Variables Documentation</h1>
      <p class="subtitle">Complete reference for the brand color system and semantic variables</p>
      <p><em>Generated on ${currentDate}</em></p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span class="stat-number">${Object.values(VARIABLE_DEFINITIONS.brand.variables).length}</span>
        <span class="stat-label">Brand Colors</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.values(VARIABLE_DEFINITIONS.semantic.variables).length}</span>
        <span class="stat-label">Semantic Variables</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.values(VARIABLE_DEFINITIONS.status.variables).length}</span>
        <span class="stat-label">Status Colors</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.values(VARIABLE_DEFINITIONS.legacy.variables).length}</span>
        <span class="stat-label">Legacy Variables</span>
      </div>
    </div>

    <div class="toc">
      <h3>Table of Contents</h3>
      <ul>
        ${Object.entries(VARIABLE_DEFINITIONS)
          .map(([key, section]) => `<li><a href="#${key}">${section.title}</a></li>`)
          .join('')}
      </ul>
    </div>

    ${Object.entries(VARIABLE_DEFINITIONS)
      .map(
        ([sectionKey, section]) => `
      <div class="section" id="${sectionKey}">
        <h2>${section.title}</h2>
        <p>${section.description}</p>
        
        <div class="variable-grid">
          ${Object.entries(section.variables)
            .map(
              ([variable, config]) => `
            <div class="variable-item">
              <div class="variable-header">
                <span class="variable-name">${variable}</span>
              </div>
              <div class="variable-description">${config.description}</div>
              ${sectionKey === 'brand' ? this.generateColorSwatch(variable, 'var(' + variable + ')') : ''}
              ${this.generateUsageExample(variable, config.description, config.usage)}
            </div>
          `
            )
            .join('')}
        </div>
        
        ${sectionKey === 'brand' ? this.generateThemeComparison(section.variables) : ''}
      </div>
    `
      )
      .join('')}

    <div class="section">
      <h2>Migration Guide</h2>
      <p>When migrating from hardcoded colors to CSS variables:</p>
      <div class="example-code">
        <pre><code>/* Before */
.button {
  background-color: #6e2765;
  color: #faf9fb;
}

/* After */
.button {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}</code></pre>
      </div>
      <p>This approach ensures your components automatically adapt to theme changes and maintain consistency across the design system.</p>
    </div>

    <div class="section">
      <h2>Best Practices</h2>
      <ul>
        <li><strong>Use semantic variables</strong> for component styling instead of brand colors directly</li>
        <li><strong>Provide fallbacks</strong> when using CSS variables: <code>var(--color-primary, #6e2765)</code></li>
        <li><strong>Test both themes</strong> to ensure proper contrast and accessibility</li>
        <li><strong>Use the validation tools</strong> to check variable definitions and contrast ratios</li>
        <li><strong>Document custom variables</strong> following the same naming conventions</li>
      </ul>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdownDocs() {
    const currentDate = new Date().toLocaleDateString();

    return `# CSS Variables Documentation

*Generated on ${currentDate}*

This document provides a complete reference for all CSS custom properties used in the design system.

## Overview

The CSS variable system is organized into four main categories:

- **Brand Colors**: Core color palette with 11 shades
- **Semantic Variables**: Theme-aware colors for UI components  
- **Status Colors**: Colors for different states and feedback
- **Legacy Variables**: Backward compatibility for existing components

## Quick Reference

| Category | Variables | Description |
|----------|-----------|-------------|
${Object.entries(VARIABLE_DEFINITIONS)
  .map(
    ([section]) =>
      `| ${section.title} | ${Object.keys(section.variables).length} | ${section.description} |`
  )
  .join('\n')}

${Object.entries(VARIABLE_DEFINITIONS)
  .map(
    ([section]) => `
## ${section.title}

${section.description}

${Object.entries(section.variables)
  .map(
    ([variable, config]) => `
### \`${variable}\`

**Description:** ${config.description}

**Usage:** ${config.usage}

\`\`\`css
.example {
  /* ${config.description} */
  color: var(${variable});
}
\`\`\`
`
  )
  .join('')}
`
  )
  .join('')}

## Migration Examples

### From Hardcoded Colors

\`\`\`css
/* Before */
.button {
  background-color: #6e2765;
  color: #faf9fb;
  border: 1px solid #a87da3;
}

/* After */
.button {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border: 1px solid var(--color-border);
}
\`\`\`

### Theme-Aware Components

\`\`\`css
.card {
  background-color: var(--color-card);
  color: var(--color-card-foreground);
  border: 1px solid var(--color-border);
}

/* Automatically adapts to light/dark themes */
\`\`\`

## Best Practices

1. **Use semantic variables** instead of brand colors directly in components
2. **Provide fallbacks** for better browser compatibility
3. **Test both themes** to ensure proper contrast
4. **Use validation tools** to check variable definitions
5. **Follow naming conventions** for custom variables

## Validation Tools

- \`npm run validate:css\` - Validate all CSS variables are defined
- \`npm run test:contrast\` - Check WCAG contrast compliance  
- \`npm run visual-verify\` - Visual testing across themes
- \`npm run test:all\` - Run all validation tests

## Browser Support

CSS custom properties are supported in all modern browsers. Fallback values are provided for better compatibility:

\`\`\`css
.element {
  color: var(--color-primary, #6e2765);
}
\`\`\`
`;
  }

  /**
   * Generate all documentation files
   */
  async generate() {
    console.log('📚 Generating CSS variable documentation...');

    // Create output directory
    await fs.mkdir(this.outputDir, { recursive: true });

    // Generate HTML documentation
    const htmlDocs = this.generateDocumentation();
    await fs.writeFile(path.join(this.outputDir, 'index.html'), htmlDocs);

    // Generate Markdown documentation
    const markdownDocs = this.generateMarkdownDocs();
    await fs.writeFile(path.join(this.outputDir, 'README.md'), markdownDocs);

    console.log('✅ Documentation generated successfully!');
    console.log(`📄 HTML: ${path.join(this.outputDir, 'index.html')}`);
    console.log(`📄 Markdown: ${path.join(this.outputDir, 'README.md')}`);
  }
}

// CLI handling
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
CSS Variable Documentation Generator

Usage:
  node scripts/generate-css-docs.js [options]

Options:
  --help, -h    Show this help message

This script generates comprehensive documentation for all CSS variables
including usage examples, color swatches, and migration guides.
  `);
  process.exit(0);
}

// Run the generator
const generator = new CSSDocumentationGenerator();
generator.generate().catch(console.error);
