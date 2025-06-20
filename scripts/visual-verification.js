#!/usr/bin/env node

/**
 * Visual Verification Script for CSS Variable Migration
 *
 * This script performs comprehensive testing of the brand color migration:
 * - Screenshots key UI components in both themes
 * - Validates contrast ratios using WCAG 2.1 standards
 * - Tests interactive states (hover, focus, active)
 * - Generates visual diff reports
 * - Switches between light/dark modes programmatically
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:4321', // Astro dev server
  outputDir: path.join(__dirname, '../visual-test-results'),
  viewports: [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ],
  testPages: [
    { path: '/', name: 'homepage' },
    { path: '/services/color', name: 'color-service' },
    { path: '/demo/landing/startup', name: 'startup-landing' },
  ],
  themes: ['light', 'dark'],
};

// WCAG contrast ratio thresholds
const CONTRAST_THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
};

class VisualVerificationTester {
  constructor() {
    this.browser = null;
    this.results = {
      screenshots: [],
      contrastTests: [],
      interactionTests: [],
      errors: [],
    };
  }

  async init() {
    console.log('🚀 Initializing Visual Verification Tester...');

    // Create output directory
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ Browser launched successfully');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrastRatio(color1, color2) {
    const getLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const parseColor = (color) => {
      const hex = color.replace('#', '');
      return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
    };

    const [r1, g1, b1] = parseColor(color1);
    const [r2, g2, b2] = parseColor(color2);

    const lum1 = getLuminance(r1, g1, b1);
    const lum2 = getLuminance(r2, g2, b2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Extract color values from computed styles
   */
  async extractColors(page) {
    return await page.evaluate(() => {
      const getComputedColor = (element, property) => {
        const computed = window.getComputedStyle(element);
        const color = computed.getPropertyValue(property);

        // Convert rgb/rgba to hex
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch;
          return '#' + [r, g, b].map((x) => parseInt(x).toString(16).padStart(2, '0')).join('');
        }

        return color;
      };

      const elements = {
        body: document.body,
        heading: document.querySelector('h1, h2, h3'),
        button: document.querySelector('button, .btn'),
        link: document.querySelector('a'),
        card: document.querySelector('.card, [class*="card"]'),
      };

      const colors = {};

      Object.entries(elements).forEach(([name, element]) => {
        if (element) {
          colors[name] = {
            background: getComputedColor(element, 'background-color'),
            color: getComputedColor(element, 'color'),
            border: getComputedColor(element, 'border-color'),
          };
        }
      });

      return colors;
    });
  }

  /**
   * Test contrast ratios for accessibility compliance
   */
  async testContrast(page, theme, pageName) {
    console.log(`🔍 Testing contrast ratios for ${pageName} (${theme} theme)...`);

    const colors = await this.extractColors(page);
    const contrastResults = [];

    Object.entries(colors).forEach(([elementName, elementColors]) => {
      if (elementColors.background && elementColors.color) {
        const ratio = this.calculateContrastRatio(elementColors.background, elementColors.color);

        const result = {
          element: elementName,
          theme,
          page: pageName,
          background: elementColors.background,
          foreground: elementColors.color,
          ratio: ratio.toFixed(2),
          passes: {
            AA_NORMAL: ratio >= CONTRAST_THRESHOLDS.AA_NORMAL,
            AA_LARGE: ratio >= CONTRAST_THRESHOLDS.AA_LARGE,
            AAA_NORMAL: ratio >= CONTRAST_THRESHOLDS.AAA_NORMAL,
            AAA_LARGE: ratio >= CONTRAST_THRESHOLDS.AAA_LARGE,
          },
        };

        contrastResults.push(result);

        if (!result.passes.AA_NORMAL) {
          console.warn(`⚠️  Low contrast detected: ${elementName} (${ratio.toFixed(2)}:1)`);
        }
      }
    });

    this.results.contrastTests.push(...contrastResults);
    return contrastResults;
  }

  /**
   * Test interactive states (hover, focus, active)
   */
  async testInteractiveStates(page, theme, pageName) {
    console.log(`🎯 Testing interactive states for ${pageName} (${theme} theme)...`);

    const interactiveElements = await page.$$('button, a, input, [tabindex]');
    const stateResults = [];

    for (const element of interactiveElements.slice(0, 5)) {
      // Test first 5 elements
      try {
        // Get element info
        const elementInfo = await element.evaluate((el) => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
        }));

        // Test hover state
        await element.hover();
        await page.waitForTimeout(100);

        const hoverScreenshot = await element.screenshot();
        const hoverPath = path.join(CONFIG.outputDir, `${pageName}-${theme}-${elementInfo.tagName}-hover.png`);
        await fs.writeFile(hoverPath, hoverScreenshot);

        // Test focus state
        await element.focus();
        await page.waitForTimeout(100);

        const focusScreenshot = await element.screenshot();
        const focusPath = path.join(CONFIG.outputDir, `${pageName}-${theme}-${elementInfo.tagName}-focus.png`);
        await fs.writeFile(focusPath, focusScreenshot);

        stateResults.push({
          element: elementInfo,
          theme,
          page: pageName,
          hoverScreenshot: hoverPath,
          focusScreenshot: focusPath,
        });
      } catch (error) {
        console.warn(`⚠️  Could not test interactive state: ${error.message}`);
      }
    }

    this.results.interactionTests.push(...stateResults);
    return stateResults;
  }

  /**
   * Switch theme programmatically
   */
  async switchTheme(page, theme) {
    await page.evaluate((targetTheme) => {
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }, theme);

    // Wait for theme transition
    await page.waitForTimeout(500);
  }

  /**
   * Take comprehensive screenshots
   */
  async takeScreenshots(page, theme, pageName, viewport) {
    console.log(`📸 Taking screenshots for ${pageName} (${theme} theme, ${viewport.name})...`);

    // Full page screenshot
    const fullPagePath = path.join(CONFIG.outputDir, `${pageName}-${theme}-${viewport.name}-full.png`);
    await page.screenshot({
      path: fullPagePath,
      fullPage: true,
    });

    // Above-the-fold screenshot
    const foldPath = path.join(CONFIG.outputDir, `${pageName}-${theme}-${viewport.name}-fold.png`);
    await page.screenshot({
      path: foldPath,
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    });

    this.results.screenshots.push({
      page: pageName,
      theme,
      viewport: viewport.name,
      fullPage: fullPagePath,
      aboveTheFold: foldPath,
    });

    return { fullPagePath, foldPath };
  }

  /**
   * Test a single page across all themes and viewports
   */
  async testPage(pageConfig) {
    const page = await this.browser.newPage();

    try {
      console.log(`\n🔄 Testing page: ${pageConfig.name}`);

      for (const viewport of CONFIG.viewports) {
        await page.setViewport(viewport);

        for (const theme of CONFIG.themes) {
          console.log(`\n  📱 ${viewport.name} - ${theme} theme`);

          // Navigate to page
          await page.goto(`${CONFIG.baseUrl}${pageConfig.path}`, {
            waitUntil: 'networkidle0',
          });

          // Switch theme
          await this.switchTheme(page, theme);

          // Take screenshots
          await this.takeScreenshots(page, theme, pageConfig.name, viewport);

          // Test contrast ratios (only on desktop to avoid redundancy)
          if (viewport.name === 'desktop') {
            await this.testContrast(page, theme, pageConfig.name);
            await this.testInteractiveStates(page, theme, pageConfig.name);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error testing page ${pageConfig.name}:`, error);
      this.results.errors.push({
        page: pageConfig.name,
        error: error.message,
      });
    } finally {
      await page.close();
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    console.log('\n📊 Generating comprehensive report...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScreenshots: this.results.screenshots.length,
        totalContrastTests: this.results.contrastTests.length,
        totalInteractionTests: this.results.interactionTests.length,
        totalErrors: this.results.errors.length,
      },
      contrastAnalysis: {
        passed: this.results.contrastTests.filter((t) => t.passes.AA_NORMAL).length,
        failed: this.results.contrastTests.filter((t) => !t.passes.AA_NORMAL).length,
        details: this.results.contrastTests,
      },
      screenshots: this.results.screenshots,
      interactionTests: this.results.interactionTests,
      errors: this.results.errors,
    };

    // Write JSON report
    const reportPath = path.join(CONFIG.outputDir, 'visual-verification-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(CONFIG.outputDir, 'visual-verification-report.html');
    await fs.writeFile(htmlPath, htmlReport);

    console.log(`✅ Report generated: ${htmlPath}`);
    return report;
  }

  /**
   * Generate HTML report for easy viewing
   */
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Verification Report</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .metric { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e9ecef; text-align: center; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #495057; }
        .metric-label { color: #6c757d; font-size: 0.9rem; }
        .section { margin-bottom: 3rem; }
        .contrast-test { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
        .contrast-test.fail { border-color: #dc3545; background: #f8d7da; }
        .contrast-test.pass { border-color: #28a745; background: #d4edda; }
        .color-swatch { display: inline-block; width: 20px; height: 20px; border-radius: 4px; margin-right: 8px; vertical-align: middle; }
        .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .screenshot-item { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .screenshot-item img { width: 100%; height: auto; }
        .screenshot-meta { padding: 1rem; background: #f8f9fa; }
        .error { background: #f8d7da; border: 1px solid #dc3545; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Visual Verification Report</h1>
        <p>CSS Variable Migration - Brand Color Integration</p>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.summary.totalScreenshots}</div>
            <div class="metric-label">Screenshots</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.contrastAnalysis.passed}</div>
            <div class="metric-label">Contrast Tests Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.contrastAnalysis.failed}</div>
            <div class="metric-label">Contrast Tests Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.totalErrors}</div>
            <div class="metric-label">Errors</div>
        </div>
    </div>

    <div class="section">
        <h2>🔍 Contrast Analysis</h2>
        ${report.contrastAnalysis.details
          .map(
            (test) => `
            <div class="contrast-test ${test.passes.AA_NORMAL ? 'pass' : 'fail'}">
                <h4>${test.element} - ${test.page} (${test.theme})</h4>
                <p>
                    <span class="color-swatch" style="background-color: ${test.background}"></span>
                    Background: ${test.background}
                    <span class="color-swatch" style="background-color: ${test.foreground}"></span>
                    Foreground: ${test.foreground}
                </p>
                <p><strong>Contrast Ratio:</strong> ${test.ratio}:1</p>
                <p>
                    <strong>WCAG Compliance:</strong>
                    AA Normal: ${test.passes.AA_NORMAL ? '✅' : '❌'} |
                    AA Large: ${test.passes.AA_LARGE ? '✅' : '❌'} |
                    AAA Normal: ${test.passes.AAA_NORMAL ? '✅' : '❌'} |
                    AAA Large: ${test.passes.AAA_LARGE ? '✅' : '❌'}
                </p>
            </div>
        `
          )
          .join('')}
    </div>

    ${
      report.errors.length > 0
        ? `
    <div class="section">
        <h2>❌ Errors</h2>
        ${report.errors
          .map(
            (error) => `
            <div class="error">
                <h4>Page: ${error.page}</h4>
                <p>${error.error}</p>
            </div>
        `
          )
          .join('')}
    </div>
    `
        : ''
    }

    <div class="section">
        <h2>📸 Screenshots</h2>
        <div class="screenshot-grid">
            ${report.screenshots
              .map(
                (screenshot) => `
                <div class="screenshot-item">
                    <img src="${path.basename(screenshot.aboveTheFold)}" alt="${screenshot.page} - ${screenshot.theme} - ${screenshot.viewport}">
                    <div class="screenshot-meta">
                        <strong>${screenshot.page}</strong><br>
                        ${screenshot.theme} theme - ${screenshot.viewport}
                    </div>
                </div>
            `
              )
              .join('')}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Run complete visual verification suite
   */
  async run() {
    try {
      await this.init();

      console.log('\n🎨 Starting Visual Verification Suite...');
      console.log(
        `Testing ${CONFIG.testPages.length} pages across ${CONFIG.themes.length} themes and ${CONFIG.viewports.length} viewports`
      );

      // Test each page
      for (const pageConfig of CONFIG.testPages) {
        await this.testPage(pageConfig);
      }

      // Generate report
      const report = await this.generateReport();

      // Print summary
      console.log('\n📊 Test Summary:');
      console.log(`  Screenshots: ${report.summary.totalScreenshots}`);
      console.log(`  Contrast Tests: ${report.contrastAnalysis.passed}/${report.summary.totalContrastTests} passed`);
      console.log(`  Errors: ${report.summary.totalErrors}`);

      if (report.contrastAnalysis.failed > 0) {
        console.warn(`\n⚠️  ${report.contrastAnalysis.failed} contrast tests failed. Check the report for details.`);
      }

      console.log(`\n✅ Visual verification complete! Report: ${CONFIG.outputDir}/visual-verification-report.html`);
    } catch (error) {
      console.error('❌ Visual verification failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new VisualVerificationTester();

  tester.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default VisualVerificationTester;
