#!/usr/bin/env node

/**
 * CSS Variable Validation Utility
 * 
 * This script validates that all CSS custom properties are properly defined
 * and accessible across different themes and contexts.
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Expected CSS variables that should be defined
const EXPECTED_VARIABLES = {
  brand: [
    '--color-brand-50',
    '--color-brand-100',
    '--color-brand-200',
    '--color-brand-300',
    '--color-brand-400',
    '--color-brand-500',
    '--color-brand-600',
    '--color-brand-700',
    '--color-brand-800',
    '--color-brand-900',
    '--color-brand-950'
  ],
  semantic: [
    '--color-background',
    '--color-foreground',
    '--color-card',
    '--color-card-foreground',
    '--color-popover',
    '--color-popover-foreground',
    '--color-primary',
    '--color-primary-foreground',
    '--color-secondary',
    '--color-secondary-foreground',
    '--color-muted',
    '--color-muted-foreground',
    '--color-accent',
    '--color-accent-foreground',
    '--color-border',
    '--color-input',
    '--color-outline',
    '--color-ring'
  ],
  status: [
    '--color-info',
    '--color-info-foreground',
    '--color-success',
    '--color-success-foreground',
    '--color-warning',
    '--color-warning-foreground',
    '--color-error',
    '--color-error-foreground'
  ],
  legacy: [
    '--aw-font-sans',
    '--aw-font-serif',
    '--aw-font-heading',
    '--aw-color-primary',
    '--aw-color-secondary',
    '--aw-color-accent',
    '--aw-color-text-heading',
    '--aw-color-text-default',
    '--aw-color-text-muted',
    '--aw-color-text-page',
    '--aw-color-bg-page',
    '--aw-color-bg-page-dark'
  ]
};

class CSSVariableValidator {
  constructor() {
    this.browser = null;
    this.results = {
      defined: [],
      undefined: [],
      fallbacks: [],
      themes: {}
    };
  }

  async init() {
    console.log('🔍 Initializing CSS Variable Validator...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✅ Browser launched successfully');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Extract all CSS custom properties from the page
   */
  async extractCSSVariables(page, theme = 'light') {
    return await page.evaluate((theme) => {
      // Apply theme class
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const computedStyle = getComputedStyle(document.documentElement);
      const variables = {};
      
      // Get all CSS custom properties
      for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i];
        if (property.startsWith('--')) {
          const value = computedStyle.getPropertyValue(property).trim();
          variables[property] = value;
        }
      }

      return variables;
    }, theme);
  }

  /**
   * Check if a CSS variable has a fallback value
   */
  async checkFallbacks(page) {
    return await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        .test-fallback {
          --test-var: var(--non-existent-var, #fallback);
          color: var(--test-var);
        }
      `;
      document.head.appendChild(style);

      const testElement = document.createElement('div');
      testElement.className = 'test-fallback';
      document.body.appendChild(testElement);

      const computedColor = getComputedStyle(testElement).color;
      
      // Clean up
      document.head.removeChild(style);
      document.body.removeChild(testElement);

      return computedColor;
    });
  }

  /**
   * Validate CSS variables for a specific theme
   */
  async validateTheme(page, theme) {
    console.log(`🎨 Validating ${theme} theme variables...`);
    
    const variables = await this.extractCSSVariables(page, theme);
    const themeResults = {
      defined: [],
      undefined: [],
      values: {}
    };

    // Check all expected variables
    const allExpected = [
      ...EXPECTED_VARIABLES.brand,
      ...EXPECTED_VARIABLES.semantic,
      ...EXPECTED_VARIABLES.status,
      ...EXPECTED_VARIABLES.legacy
    ];

    for (const variable of allExpected) {
      if (variables[variable]) {
        themeResults.defined.push(variable);
        themeResults.values[variable] = variables[variable];
      } else {
        themeResults.undefined.push(variable);
      }
    }

    this.results.themes[theme] = themeResults;
    
    console.log(`  ✅ ${themeResults.defined.length} variables defined`);
    if (themeResults.undefined.length > 0) {
      console.log(`  ⚠️  ${themeResults.undefined.length} variables undefined`);
    }

    return themeResults;
  }

  /**
   * Test CSS variable inheritance and cascading
   */
  async testInheritance(page) {
    console.log('🔗 Testing CSS variable inheritance...');
    
    return await page.evaluate(() => {
      // Create nested elements to test inheritance
      const parent = document.createElement('div');
      parent.style.setProperty('--test-inherit', '#parent');
      
      const child = document.createElement('div');
      parent.appendChild(child);
      document.body.appendChild(parent);

      const parentValue = getComputedStyle(parent).getPropertyValue('--test-inherit');
      const childValue = getComputedStyle(child).getPropertyValue('--test-inherit');

      // Clean up
      document.body.removeChild(parent);

      return {
        parentValue: parentValue.trim(),
        childValue: childValue.trim(),
        inherits: parentValue.trim() === childValue.trim()
      };
    });
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalExpected: Object.values(EXPECTED_VARIABLES).flat().length,
        lightThemeDefined: this.results.themes.light?.defined.length || 0,
        darkThemeDefined: this.results.themes.dark?.defined.length || 0,
        lightThemeUndefined: this.results.themes.light?.undefined.length || 0,
        darkThemeUndefined: this.results.themes.dark?.undefined.length || 0
      },
      themes: this.results.themes,
      recommendations: []
    };

    // Generate recommendations
    if (report.summary.lightThemeUndefined > 0) {
      report.recommendations.push({
        type: 'warning',
        message: `${report.summary.lightThemeUndefined} variables undefined in light theme`,
        variables: this.results.themes.light?.undefined || []
      });
    }

    if (report.summary.darkThemeUndefined > 0) {
      report.recommendations.push({
        type: 'warning',
        message: `${report.summary.darkThemeUndefined} variables undefined in dark theme`,
        variables: this.results.themes.dark?.undefined || []
      });
    }

    // Check for consistency between themes
    const lightDefined = new Set(this.results.themes.light?.defined || []);
    const darkDefined = new Set(this.results.themes.dark?.defined || []);
    
    const onlyInLight = [...lightDefined].filter(v => !darkDefined.has(v));
    const onlyInDark = [...darkDefined].filter(v => !lightDefined.has(v));

    if (onlyInLight.length > 0) {
      report.recommendations.push({
        type: 'error',
        message: 'Variables defined only in light theme',
        variables: onlyInLight
      });
    }

    if (onlyInDark.length > 0) {
      report.recommendations.push({
        type: 'error',
        message: 'Variables defined only in dark theme',
        variables: onlyInDark
      });
    }

    return report;
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Variable Validation Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.6; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; }
    .stat-value { font-size: 2rem; font-weight: bold; color: #1e40af; }
    .stat-label { color: #64748b; font-size: 0.875rem; }
    .section { margin-bottom: 2rem; }
    .theme-section { background: #f8fafc; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .variable-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.5rem; }
    .variable-item { background: white; padding: 0.5rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem; }
    .variable-value { color: #6b7280; margin-left: 0.5rem; }
    .recommendation { padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .recommendation.warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .recommendation.error { background: #fee2e2; border-left: 4px solid #dc2626; }
    .recommendation.success { background: #d1fae5; border-left: 4px solid #10b981; }
    .timestamp { color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CSS Variable Validation Report</h1>
    <p class="timestamp">Generated: ${report.timestamp}</p>
  </div>

  <div class="summary">
    <div class="stat-card">
      <div class="stat-value">${report.summary.totalExpected}</div>
      <div class="stat-label">Total Expected Variables</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.summary.lightThemeDefined}</div>
      <div class="stat-label">Light Theme Defined</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.summary.darkThemeDefined}</div>
      <div class="stat-label">Dark Theme Defined</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.summary.lightThemeUndefined + report.summary.darkThemeUndefined}</div>
      <div class="stat-label">Total Undefined</div>
    </div>
  </div>

  ${report.recommendations.length > 0 ? `
  <div class="section">
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
      <div class="recommendation ${rec.type}">
        <strong>${rec.message}</strong>
        ${rec.variables ? `
          <div class="variable-list" style="margin-top: 0.5rem;">
            ${rec.variables.map(v => `<div class="variable-item">${v}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Theme Details</h2>
    ${Object.entries(report.themes).map(([theme, data]) => `
      <div class="theme-section">
        <h3>${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme</h3>
        <p><strong>Defined:</strong> ${data.defined.length} variables</p>
        <p><strong>Undefined:</strong> ${data.undefined.length} variables</p>
        
        ${data.defined.length > 0 ? `
          <h4>Defined Variables</h4>
          <div class="variable-list">
            ${data.defined.map(v => `
              <div class="variable-item">
                ${v}
                <span class="variable-value">${data.values[v] || ''}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${data.undefined.length > 0 ? `
          <h4>Undefined Variables</h4>
          <div class="variable-list">
            ${data.undefined.map(v => `<div class="variable-item" style="background: #fee2e2;">${v}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }

  /**
   * Run the validation
   */
  async run() {
    try {
      await this.init();
      
      const page = await this.browser.newPage();
      await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });

      // Test both themes
      await this.validateTheme(page, 'light');
      await this.validateTheme(page, 'dark');

      // Test inheritance
      const inheritanceTest = await this.testInheritance(page);
      console.log(`🔗 CSS variable inheritance: ${inheritanceTest.inherits ? '✅ Working' : '❌ Failed'}`);

      // Generate reports
      const report = this.generateReport();
      const htmlReport = this.generateHTMLReport(report);

      // Save reports
      const outputDir = path.join(__dirname, '../css-validation-results');
      await fs.mkdir(outputDir, { recursive: true });

      await fs.writeFile(
        path.join(outputDir, 'validation-report.json'),
        JSON.stringify(report, null, 2)
      );

      await fs.writeFile(
        path.join(outputDir, 'validation-report.html'),
        htmlReport
      );

      // Console summary
      console.log('\n📊 Validation Summary:');
      console.log(`  Total Expected: ${report.summary.totalExpected}`);
      console.log(`  Light Theme: ${report.summary.lightThemeDefined}/${report.summary.totalExpected} defined`);
      console.log(`  Dark Theme: ${report.summary.darkThemeDefined}/${report.summary.totalExpected} defined`);
      
      if (report.recommendations.length > 0) {
        console.log(`\n⚠️  ${report.recommendations.length} recommendations found`);
        report.recommendations.forEach(rec => {
          console.log(`  ${rec.type.toUpperCase()}: ${rec.message}`);
        });
      } else {
        console.log('\n✅ All CSS variables properly defined!');
      }

      console.log(`\n📄 Reports saved to: ${outputDir}`);

    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
CSS Variable Validator

Usage:
  node scripts/css-variable-validator.js [options]

Options:
  --help, -h    Show this help message

This script validates that all expected CSS custom properties are properly
defined and accessible across light and dark themes.
  `);
  process.exit(0);
}

// Run the validator
const validator = new CSSVariableValidator();
validator.run().catch(console.error); 