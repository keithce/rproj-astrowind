#!/usr/bin/env node

/**
 * Content Analysis Script
 * Analyzes website content for readability and SEO optimization
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentAnalyzer {
  constructor() {
    this.browser = null;
    this.results = {
      pages: [],
      summary: {
        avgReadabilityScore: 0,
        totalIssues: 0,
        pagesAnalyzed: 0,
      },
      recommendations: [],
    };
  }

  async init() {
    console.log('🔍 Initializing Content Analyzer...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Analyze readability metrics for text content
   */
  calculateReadabilityMetrics(text) {
    // Remove HTML and normalize text
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Sentence analysis
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);

    // Calculate metrics
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Syllable count (simplified)
    const syllables = words.reduce((sum, word) => {
      return sum + Math.max(1, word.match(/[aeiouy]+/gi)?.length || 1);
    }, 0);
    const avgSyllables = syllables / words.length;

    // Flesch Reading Ease Score
    const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables;

    // Passive voice detection (simplified)
    const passiveCount = sentences.filter(sentence => {
      return /\b(was|were|is|are|been|being)\s+\w*ed\b/i.test(sentence);
    }).length;

    // Complex words (3+ syllables)
    const complexWords = words.filter(word => {
      const syllableCount = word.match(/[aeiouy]+/gi)?.length || 1;
      return syllableCount >= 3;
    }).length;

    return {
      sentences: sentences.length,
      words: words.length,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      fleschScore: Math.round(fleschScore),
      readingLevel: this.getReadingLevel(fleschScore),
      passiveVoice: passiveCount,
      complexWords: complexWords,
      issues: this.identifyIssues(avgSentenceLength, fleschScore, passiveCount, sentences.length),
    };
  }

  getReadingLevel(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College level)';
    return 'Very Difficult (Graduate level)';
  }

  identifyIssues(avgSentenceLength, fleschScore, passiveCount, totalSentences) {
    const issues = [];

    if (avgSentenceLength > 20) {
      issues.push('Long sentences detected - consider breaking up for better readability');
    }

    if (fleschScore < 60) {
      issues.push('Reading level too high - simplify language for web audience');
    }

    const passivePercentage = (passiveCount / totalSentences) * 100;
    if (passivePercentage > 20) {
      issues.push(`High passive voice usage (${Math.round(passivePercentage)}%) - use more active voice`);
    }

    return issues;
  }

  /**
   * Analyze a single page
   */
  async analyzePage(url, pageName) {
    console.log(`📄 Analyzing: ${pageName} (${url})`);

    const page = await this.browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Extract content for analysis
      const pageData = await page.evaluate(() => {
        // Get main content
        const mainContent = document.querySelector('main, article, .prose, [role="main"]') || document.body;

        // Extract text content
        const textContent = mainContent.textContent || '';

        // Extract headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent.trim(),
          tag: h.tagName.toLowerCase(),
        }));

        // Extract meta information
        const title = document.querySelector('title')?.textContent || '';
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        // Count internal links
        const internalLinks = Array.from(document.querySelectorAll('a[href^="/"], a[href*="rproj.art"]')).length;

        // Extract key content sections
        const heroText = document.querySelector('[class*="hero"] h1, [class*="hero"] h2')?.textContent || '';
        const firstParagraph = document.querySelector('p')?.textContent || '';

        return {
          textContent: textContent.substring(0, 10000), // Limit for analysis
          headings,
          title,
          metaDescription,
          internalLinks,
          heroText,
          firstParagraph,
          contentLength: textContent.length,
        };
      });

      // Analyze content
      const readabilityMetrics = this.calculateReadabilityMetrics(pageData.textContent);

      // SEO analysis
      const seoIssues = [];

      // Title length
      if (pageData.title.length > 60) {
        seoIssues.push('Title too long for SEO (>60 characters)');
      } else if (pageData.title.length < 30) {
        seoIssues.push('Title too short for SEO (<30 characters)');
      }

      // Meta description
      if (pageData.metaDescription.length > 160) {
        seoIssues.push('Meta description too long (>160 characters)');
      } else if (pageData.metaDescription.length < 120) {
        seoIssues.push('Meta description too short (<120 characters)');
      }

      // Heading structure
      const h1Count = pageData.headings.filter(h => h.level === 1).length;
      if (h1Count === 0) {
        seoIssues.push('Missing H1 tag');
      } else if (h1Count > 1) {
        seoIssues.push('Multiple H1 tags detected');
      }

      // Internal linking
      if (pageData.internalLinks < 3) {
        seoIssues.push('Insufficient internal links (<3)');
      }

      const pageResult = {
        name: pageName,
        url: url,
        readability: readabilityMetrics,
        seo: {
          title: pageData.title,
          titleLength: pageData.title.length,
          metaDescription: pageData.metaDescription,
          metaDescriptionLength: pageData.metaDescription.length,
          headings: pageData.headings,
          internalLinks: pageData.internalLinks,
          issues: seoIssues,
        },
        content: {
          heroText: pageData.heroText,
          firstParagraph: pageData.firstParagraph,
          totalLength: pageData.contentLength,
        },
        recommendations: [...readabilityMetrics.issues, ...seoIssues],
      };

      this.results.pages.push(pageResult);

      console.log(`  ✅ Analysis complete - ${readabilityMetrics.issues.length + seoIssues.length} issues found`);
    } catch (error) {
      console.error(`  ❌ Error analyzing ${pageName}:`, error.message);
    } finally {
      await page.close();
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const totalIssues = this.results.pages.reduce((sum, page) => sum + page.recommendations.length, 0);
    const avgReadability =
      this.results.pages.reduce((sum, page) => sum + page.readability.fleschScore, 0) / this.results.pages.length;

    this.results.summary = {
      avgReadabilityScore: Math.round(avgReadability),
      totalIssues: totalIssues,
      pagesAnalyzed: this.results.pages.length,
    };

    // Generate site-wide recommendations
    this.results.recommendations = this.generateSiteRecommendations();

    return this.results;
  }

  generateSiteRecommendations() {
    const recommendations = [];
    const pages = this.results.pages;

    // Readability consistency
    const readabilityScores = pages.map(p => p.readability.fleschScore);
    const minScore = Math.min(...readabilityScores);
    const maxScore = Math.max(...readabilityScores);

    if (maxScore - minScore > 30) {
      recommendations.push('Large variation in readability across pages - standardize writing style');
    }

    // SEO consistency
    const pagesWithSEOIssues = pages.filter(p => p.seo.issues.length > 0).length;
    if (pagesWithSEOIssues > pages.length * 0.5) {
      recommendations.push('Over 50% of pages have SEO issues - implement systematic optimization');
    }

    // Internal linking opportunities
    const avgInternalLinks = pages.reduce((sum, p) => sum + p.seo.internalLinks, 0) / pages.length;
    if (avgInternalLinks < 5) {
      recommendations.push('Increase internal linking across all pages for better SEO');
    }

    return recommendations;
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
  <title>Content Analysis Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.6; }
    .header { background: #f8f9fa; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .metric { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e9ecef; text-align: center; }
    .metric-value { font-size: 2rem; font-weight: bold; color: #495057; }
    .metric-label { color: #6c757d; font-size: 0.875rem; }
    .page-analysis { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
    .page-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; color: #343a40; }
    .score { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; color: white; font-weight: bold; }
    .score.good { background: #28a745; }
    .score.average { background: #ffc107; color: #212529; }
    .score.poor { background: #dc3545; }
    .issues { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
    .recommendations { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 1rem; margin-top: 1rem; }
    .issue-item { margin: 0.5rem 0; }
    .content-preview { background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 0.5rem 0; font-family: monospace; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Content Readability & SEO Analysis</h1>
    <p>Generated: ${new Date().toISOString()}</p>
  </div>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${this.results.summary.avgReadabilityScore}</div>
      <div class="metric-label">Avg Readability Score</div>
    </div>
    <div class="metric">
      <div class="metric-value">${this.results.summary.totalIssues}</div>
      <div class="metric-label">Total Issues Found</div>
    </div>
    <div class="metric">
      <div class="metric-value">${this.results.summary.pagesAnalyzed}</div>
      <div class="metric-label">Pages Analyzed</div>
    </div>
  </div>

  ${this.results.pages
    .map(
      page => `
    <div class="page-analysis">
      <div class="page-title">
        ${page.name}
        <span class="score ${page.readability.fleschScore >= 60 ? 'good' : page.readability.fleschScore >= 30 ? 'average' : 'poor'}">
          ${page.readability.fleschScore} Flesch Score
        </span>
      </div>

      <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <h4>Readability Metrics</h4>
          <ul>
            <li>Sentences: ${page.readability.sentences}</li>
            <li>Words: ${page.readability.words}</li>
            <li>Avg Sentence Length: ${page.readability.avgSentenceLength} words</li>
            <li>Reading Level: ${page.readability.readingLevel}</li>
            <li>Passive Voice: ${page.readability.passiveVoice} sentences</li>
            <li>Complex Words: ${page.readability.complexWords}</li>
          </ul>
        </div>
        
        <div>
          <h4>SEO Metrics</h4>
          <ul>
            <li>Title Length: ${page.seo.titleLength} chars</li>
            <li>Meta Description: ${page.seo.metaDescriptionLength} chars</li>
            <li>Internal Links: ${page.seo.internalLinks}</li>
            <li>Content Length: ${page.content.totalLength} chars</li>
            <li>Headings: ${page.seo.headings.length}</li>
          </ul>
        </div>
      </div>

      ${
        page.content.heroText &&
        `
        <div class="content-preview">
          <strong>Hero Text:</strong> ${page.content.heroText.substring(0, 200)}...
        </div>
      `
      }

      ${
        page.recommendations.length > 0
          ? `
        <div class="issues">
          <h4>Issues & Recommendations</h4>
          ${page.recommendations.map(rec => `<div class="issue-item">• ${rec}</div>`).join('')}
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('')}

  ${
    this.results.recommendations.length > 0
      ? `
    <div class="recommendations">
      <h3>Site-Wide Recommendations</h3>
      ${this.results.recommendations.map(rec => `<div class="issue-item">• ${rec}</div>`).join('')}
    </div>
  `
      : ''
  }
</body>
</html>`;
  }

  /**
   * Run complete analysis
   */
  async run() {
    const pagesToAnalyze = [
      { url: 'http://localhost:4321/', name: 'Homepage' },
      { url: 'http://localhost:4321/about', name: 'About' },
      { url: 'http://localhost:4321/services/design', name: 'Design Service' },
      { url: 'http://localhost:4321/services/rhythm', name: 'Rhythm Service' },
      { url: 'http://localhost:4321/services/color', name: 'Color Service' },
      { url: 'http://localhost:4321/services/motion', name: 'Motion Service' },
      { url: 'http://localhost:4321/contact', name: 'Contact' },
    ];

    try {
      await this.init();

      for (const pageConfig of pagesToAnalyze) {
        await this.analyzePage(pageConfig.url, pageConfig.name);
      }

      // Generate report
      const report = this.generateReport();
      const htmlReport = this.generateHTMLReport();

      // Save reports
      const outputDir = path.join(__dirname, '../content-analysis-results');
      await fs.mkdir(outputDir, { recursive: true });

      await fs.writeFile(path.join(outputDir, 'content-analysis.json'), JSON.stringify(report, null, 2));
      await fs.writeFile(path.join(outputDir, 'content-analysis.html'), htmlReport);

      console.log('\n📊 Analysis Summary:');
      console.log(`  Pages Analyzed: ${report.summary.pagesAnalyzed}`);
      console.log(`  Avg Readability: ${report.summary.avgReadabilityScore} (Flesch Score)`);
      console.log(`  Total Issues: ${report.summary.totalIssues}`);
      console.log(`\n📄 Report saved to: ${outputDir}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
const analyzer = new ContentAnalyzer();
analyzer.run().catch(console.error);
