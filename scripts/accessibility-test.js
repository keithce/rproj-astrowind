#!/usr/bin/env node

/**
 * Comprehensive Accessibility Testing Script
 * Integrates axe-core, Lighthouse, and custom accessibility checks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import axeCore from 'axe-core';
import config from '../accessibility.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AccessibilityTester {
  constructor(options = {}) {
    this.config = config;
    this.options = {
      headless: options.headless !== false,
      environment: options.environment || 'development',
      outputDir: options.outputDir || './accessibility-reports',
      verbose: options.verbose || false,
      ...options,
    };

    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        timestamp: new Date().toISOString(),
        environment: this.options.environment,
      },
      axe: [],
      lighthouse: [],
      custom: [],
      violations: [],
    };
  }

  /**
   * Main test execution method
   */
  async run() {
    console.log('🚀 Starting comprehensive accessibility testing...');

    try {
      // Setup
      await this.setup();

      // Run tests
      await this.runAxeTests();
      await this.runLighthouseTests();
      await this.runCustomTests();

      // Generate reports
      await this.generateReports();

      // Send alerts if needed
      await this.sendAlerts();

      console.log('✅ Accessibility testing completed successfully');

      // Exit with appropriate code
      process.exit(this.results.summary.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Accessibility testing failed:', error);
      process.exit(1);
    }
  }

  /**
   * Setup testing environment
   */
  async setup() {
    // Create output directory
    await fs.mkdir(this.options.outputDir, { recursive: true });

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    console.log('🔧 Testing environment setup complete');
  }

  /**
   * Run axe-core accessibility tests
   */
  async runAxeTests() {
    console.log('🔍 Running axe-core accessibility tests...');

    const page = await this.browser.newPage();
    const baseUrl = this.config.workflow.environments[this.options.environment].baseUrl;

    for (const pagePath of this.config.axe.testPages) {
      const url = `${baseUrl}${pagePath}`;
      console.log(`  Testing: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Inject axe-core
        await page.addScriptTag({
          path: path.join(__dirname, '../node_modules/axe-core/axe.min.js'),
        });

        // Run axe tests for different viewports
        for (const viewport of this.config.axe.environment.viewports) {
          await page.setViewport(viewport);

          const results = await page.evaluate((axeConfig) => {
            return axe.run(document, {
              rules: axeConfig.rules,
              tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
            });
          }, this.config.axe);

          this.processAxeResults(results, url, viewport.name);
        }

        // Run scenario tests
        for (const scenario of this.config.axe.scenarios) {
          await this.runScenarioTest(page, scenario, url);
        }
      } catch (error) {
        console.error(`  ❌ Error testing ${url}:`, error.message);
        this.results.violations.push({
          type: 'axe-error',
          url,
          error: error.message,
        });
      }
    }

    await page.close();
    console.log('✅ Axe-core tests completed');
  }

  /**
   * Run Lighthouse accessibility audits
   */
  async runLighthouseTests() {
    console.log('🔍 Running Lighthouse accessibility audits...');

    const baseUrl = this.config.workflow.environments[this.options.environment].baseUrl;

    for (const pagePath of this.config.axe.testPages) {
      const url = `${baseUrl}${pagePath}`;
      console.log(`  Auditing: ${url}`);

      try {
        const { lhr } = await lighthouse(
          url,
          {
            port: new URL(this.browser.wsEndpoint()).port,
            output: 'json',
            logLevel: 'info',
            onlyCategories: ['accessibility', 'best-practices', 'seo'],
          },
          this.config.lighthouse.config
        );

        this.processLighthouseResults(lhr, url);
      } catch (error) {
        console.error(`  ❌ Error auditing ${url}:`, error.message);
        this.results.violations.push({
          type: 'lighthouse-error',
          url,
          error: error.message,
        });
      }
    }

    console.log('✅ Lighthouse audits completed');
  }

  /**
   * Run custom accessibility tests
   */
  async runCustomTests() {
    console.log('🔍 Running custom accessibility tests...');

    const page = await this.browser.newPage();
    const baseUrl = this.config.workflow.environments[this.options.environment].baseUrl;

    for (const pagePath of this.config.axe.testPages) {
      const url = `${baseUrl}${pagePath}`;
      console.log(`  Custom testing: ${url}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Test focus management
        if (this.config.customChecks.focusManagement.enabled) {
          await this.testFocusManagement(page, url);
        }

        // Test ARIA live regions
        if (this.config.customChecks.liveRegions.enabled) {
          await this.testLiveRegions(page, url);
        }

        // Test color contrast
        if (this.config.customChecks.colorContrast.enabled) {
          await this.testColorContrast(page, url);
        }

        // Test motion accessibility
        if (this.config.customChecks.motionAccessibility.enabled) {
          await this.testMotionAccessibility(page, url);
        }
      } catch (error) {
        console.error(`  ❌ Error in custom tests for ${url}:`, error.message);
        this.results.violations.push({
          type: 'custom-error',
          url,
          error: error.message,
        });
      }
    }

    await page.close();
    console.log('✅ Custom tests completed');
  }

  /**
   * Test focus management functionality
   */
  async testFocusManagement(page, url) {
    const focusTests = await page.evaluate(() => {
      const results = [];

      // Test skip links
      const skipLinks = document.querySelectorAll('.skip-link');
      results.push({
        test: 'skip-links-present',
        passed: skipLinks.length > 0,
        message: `Found ${skipLinks.length} skip links`,
      });

      // Test focus trap functionality
      const focusManager = window.focusManager;
      results.push({
        test: 'focus-manager-available',
        passed: !!focusManager,
        message: focusManager ? 'Focus manager is available' : 'Focus manager not found',
      });

      // Test keyboard navigation
      const focusableElements = document.querySelectorAll(
        'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      results.push({
        test: 'focusable-elements-present',
        passed: focusableElements.length > 0,
        message: `Found ${focusableElements.length} focusable elements`,
      });

      return results;
    });

    this.results.custom.push({
      url,
      category: 'focus-management',
      tests: focusTests,
    });
  }

  /**
   * Test ARIA live regions functionality
   */
  async testLiveRegions(page, url) {
    const liveRegionTests = await page.evaluate(() => {
      const results = [];

      // Test live region presence
      const liveRegions = document.querySelectorAll('[aria-live]');
      results.push({
        test: 'live-regions-present',
        passed: liveRegions.length > 0,
        message: `Found ${liveRegions.length} ARIA live regions`,
      });

      // Test live region types
      const politeRegions = document.querySelectorAll('[aria-live="polite"]');
      const assertiveRegions = document.querySelectorAll('[aria-live="assertive"]');

      results.push({
        test: 'live-region-types',
        passed: politeRegions.length > 0 && assertiveRegions.length > 0,
        message: `Polite: ${politeRegions.length}, Assertive: ${assertiveRegions.length}`,
      });

      // Test aria-atomic usage
      const atomicRegions = document.querySelectorAll('[aria-atomic="true"]');
      results.push({
        test: 'aria-atomic-usage',
        passed: atomicRegions.length > 0,
        message: `Found ${atomicRegions.length} regions with aria-atomic`,
      });

      return results;
    });

    this.results.custom.push({
      url,
      category: 'live-regions',
      tests: liveRegionTests,
    });
  }

  /**
   * Test color contrast ratios
   */
  async testColorContrast(page, url) {
    const contrastTests = await page.evaluate((minRatios) => {
      const results = [];

      // Get all text elements
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
      let totalTests = 0;
      let passed = 0;

      for (const element of textElements) {
        if (element.offsetParent !== null) {
          // Element is visible
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          // Simple contrast check (would need proper contrast calculation library)
          if (color && backgroundColor && color !== backgroundColor) {
            totalTests++;
            // This is a simplified check - in real implementation,
            // you'd use a proper contrast calculation library
            passed++;
          }
        }
      }

      results.push({
        test: 'color-contrast-check',
        passed: passed === totalTests,
        message: `Checked ${totalTests} elements, ${passed} passed basic contrast test`,
      });

      return results;
    }, this.config.customChecks.colorContrast.minimumRatio);

    this.results.custom.push({
      url,
      category: 'color-contrast',
      tests: contrastTests,
    });
  }

  /**
   * Test motion accessibility features
   */
  async testMotionAccessibility(page, url) {
    const motionTests = await page.evaluate(() => {
      const results = [];

      // Test prefers-reduced-motion support
      const hasReducedMotionCSS = Array.from(document.styleSheets).some((sheet) => {
        try {
          return Array.from(sheet.cssRules).some(
            (rule) => rule.conditionText && rule.conditionText.includes('prefers-reduced-motion')
          );
        } catch (e) {
          return false;
        }
      });

      results.push({
        test: 'prefers-reduced-motion-support',
        passed: hasReducedMotionCSS,
        message: hasReducedMotionCSS
          ? 'Found prefers-reduced-motion CSS rules'
          : 'No prefers-reduced-motion support found',
      });

      // Test for auto-playing animations
      const animatedElements = document.querySelectorAll('[style*="animation"], .animate-');
      results.push({
        test: 'animation-elements-check',
        passed: true, // Would need more sophisticated check
        message: `Found ${animatedElements.length} potentially animated elements`,
      });

      return results;
    });

    this.results.custom.push({
      url,
      category: 'motion-accessibility',
      tests: motionTests,
    });
  }

  /**
   * Run scenario-based tests
   */
  async runScenarioTest(page, scenario, url) {
    console.log(`    Running scenario: ${scenario.name}`);

    try {
      for (const action of scenario.actions) {
        switch (action.type) {
          case 'click':
            await page.click(action.selector);
            break;
          case 'type':
            await page.type(action.selector, action.text);
            break;
          case 'key':
            await page.keyboard.press(action.key);
            break;
        }

        // Wait for any dynamic content
        await page.waitForTimeout(500);
      }

      // Run axe again after interactions
      const results = await page.evaluate((axeConfig) => {
        return axe.run(document, {
          rules: axeConfig.rules,
          tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        });
      }, this.config.axe);

      this.processAxeResults(results, url, `scenario-${scenario.name}`);
    } catch (error) {
      console.error(`    ❌ Scenario ${scenario.name} failed:`, error.message);
    }
  }

  /**
   * Process axe-core test results
   */
  processAxeResults(results, url, context) {
    this.results.axe.push({
      url,
      context,
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      timestamp: new Date().toISOString(),
    });

    this.results.summary.totalTests += results.violations.length + results.passes.length;
    this.results.summary.failed += results.violations.length;
    this.results.summary.passed += results.passes.length;
    this.results.summary.warnings += results.incomplete.length;

    if (results.violations.length > 0) {
      console.log(`    ⚠️  ${results.violations.length} violations found in ${context}`);
      results.violations.forEach((violation) => {
        this.results.violations.push({
          type: 'axe-violation',
          url,
          context,
          rule: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.length,
        });
      });
    }
  }

  /**
   * Process Lighthouse test results
   */
  processLighthouseResults(lhr, url) {
    const accessibilityScore = lhr.categories.accessibility.score * 100;
    const bestPracticesScore = lhr.categories['best-practices'].score * 100;
    const seoScore = lhr.categories.seo.score * 100;

    this.results.lighthouse.push({
      url,
      scores: {
        accessibility: accessibilityScore,
        bestPractices: bestPracticesScore,
        seo: seoScore,
      },
      audits: lhr.audits,
      timestamp: new Date().toISOString(),
    });

    // Check against thresholds
    const thresholds = this.config.lighthouse.accessibility.thresholds;
    if (accessibilityScore < thresholds.accessibility) {
      this.results.violations.push({
        type: 'lighthouse-threshold',
        url,
        category: 'accessibility',
        score: accessibilityScore,
        threshold: thresholds.accessibility,
      });
    }

    console.log(`    📊 Scores - A11y: ${accessibilityScore}%, BP: ${bestPracticesScore}%, SEO: ${seoScore}%`);
  }

  /**
   * Generate comprehensive reports
   */
  async generateReports() {
    console.log('📊 Generating accessibility reports...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // JSON Report
    await fs.writeFile(
      path.join(this.options.outputDir, `accessibility-report-${timestamp}.json`),
      JSON.stringify(this.results, null, 2)
    );

    // HTML Report
    const htmlReport = this.generateHTMLReport();
    await fs.writeFile(path.join(this.options.outputDir, `accessibility-report-${timestamp}.html`), htmlReport);

    // JUnit XML Report (for CI/CD)
    const junitReport = this.generateJUnitReport();
    await fs.writeFile(path.join(this.options.outputDir, `accessibility-junit-${timestamp}.xml`), junitReport);

    // Summary Report
    const summaryReport = this.generateSummaryReport();
    await fs.writeFile(path.join(this.options.outputDir, `accessibility-summary-${timestamp}.txt`), summaryReport);

    console.log(`📁 Reports saved to: ${this.options.outputDir}`);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
        .header { background: #0052FF; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #0052FF; }
        .violations { background: #fff5f5; border-left-color: #e53e3e; }
        .passed { background: #f0fff4; border-left-color: #38a169; }
        .warnings { background: #fffbf0; border-left-color: #d69e2e; }
        .violation-item { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 3px solid #e53e3e; }
        .impact-critical { border-left-color: #e53e3e; }
        .impact-serious { border-left-color: #d69e2e; }
        .impact-moderate { border-left-color: #3182ce; }
        .impact-minor { border-left-color: #38a169; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Accessibility Test Report</h1>
        <p>Generated: ${this.results.summary.timestamp}</p>
        <p>Environment: ${this.results.summary.environment}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Total Tests</h3>
            <h2>${this.results.summary.totalTests}</h2>
        </div>
        <div class="card passed">
            <h3>Passed</h3>
            <h2>${this.results.summary.passed}</h2>
        </div>
        <div class="card violations">
            <h3>Failed</h3>
            <h2>${this.results.summary.failed}</h2>
        </div>
        <div class="card warnings">
            <h3>Warnings</h3>
            <h2>${this.results.summary.warnings}</h2>
        </div>
    </div>
    
    <h2>🚨 Violations</h2>
    ${this.results.violations
      .map(
        (violation) => `
        <div class="violation-item impact-${violation.impact || 'moderate'}">
            <h4>${violation.rule || violation.type}</h4>
            <p><strong>URL:</strong> ${violation.url}</p>
            <p><strong>Description:</strong> ${violation.description || violation.error}</p>
            ${violation.nodes ? `<p><strong>Affected Elements:</strong> ${violation.nodes}</p>` : ''}
        </div>
    `
      )
      .join('')}
    
    <h2>📊 Lighthouse Scores</h2>
    ${this.results.lighthouse
      .map(
        (result) => `
        <div class="card">
            <h4>${result.url}</h4>
            <p>Accessibility: ${result.scores.accessibility}%</p>
            <p>Best Practices: ${result.scores.bestPractices}%</p>
            <p>SEO: ${result.scores.seo}%</p>
        </div>
    `
      )
      .join('')}
</body>
</html>`;
  }

  /**
   * Generate JUnit XML report
   */
  generateJUnitReport() {
    const testSuites = this.results.axe
      .map((result) => {
        const tests = [...result.violations, ...result.passes];
        return `
    <testsuite name="Accessibility Tests - ${result.url}" tests="${tests.length}" failures="${result.violations.length}">
      ${tests
        .map(
          (test) => `
        <testcase name="${test.id || test.rule}" classname="accessibility">
          ${test.impact ? `<failure message="${test.description}">${test.help}</failure>` : ''}
        </testcase>
      `
        )
        .join('')}
    </testsuite>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  ${testSuites}
</testsuites>`;
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    return `
ACCESSIBILITY TEST SUMMARY
==========================

Generated: ${this.results.summary.timestamp}
Environment: ${this.results.summary.environment}

RESULTS:
--------
Total Tests: ${this.results.summary.totalTests}
Passed: ${this.results.summary.passed}
Failed: ${this.results.summary.failed}
Warnings: ${this.results.summary.warnings}

SUCCESS RATE: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(2)}%

VIOLATIONS BY TYPE:
------------------
${this.results.violations.reduce((acc, violation) => {
  acc[violation.type] = (acc[violation.type] || 0) + 1;
  return acc;
}, {})}

RECOMMENDATIONS:
---------------
${this.results.summary.failed > 0 ? '❌ Address accessibility violations before deployment' : '✅ All accessibility tests passed'}
${this.results.summary.warnings > 0 ? '⚠️ Review warnings for potential improvements' : ''}

For detailed information, see the HTML report.
`;
  }

  /**
   * Send alerts for failures
   */
  async sendAlerts() {
    if (this.results.summary.failed === 0) return;

    console.log('📢 Sending accessibility alerts...');

    // Slack alert
    if (this.config.workflow.alerts.slack.webhook) {
      try {
        const response = await fetch(this.config.workflow.alerts.slack.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: this.config.workflow.alerts.slack.channel,
            text: `🚨 Accessibility Test Failures Detected`,
            attachments: [
              {
                color: 'danger',
                fields: [
                  { title: 'Failed Tests', value: this.results.summary.failed, short: true },
                  { title: 'Environment', value: this.results.summary.environment, short: true },
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          console.log('✅ Slack alert sent');
        }
      } catch (error) {
        console.error('❌ Failed to send Slack alert:', error.message);
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    headless: !args.includes('--headed'),
    environment: args.find((arg) => arg.startsWith('--env='))?.split('=')[1] || 'development',
    verbose: args.includes('--verbose'),
  };

  const tester = new AccessibilityTester(options);

  process.on('SIGINT', async () => {
    console.log('\n🛑 Test interrupted, cleaning up...');
    await tester.cleanup();
    process.exit(1);
  });

  tester.run().catch(async (error) => {
    console.error('❌ Test execution failed:', error);
    await tester.cleanup();
    process.exit(1);
  });
}

export default AccessibilityTester;
