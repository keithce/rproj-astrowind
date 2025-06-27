/**
 * Accessibility Testing Configuration
 * Comprehensive setup for automated accessibility testing using axe-core and Lighthouse
 */

export default {
  // Axe-core configuration
  axe: {
    // Core accessibility rules to test
    rules: {
      // WCAG 2.1 Level A rules
      'color-contrast': { enabled: true, tags: ['wcag2a', 'wcag143'] },
      'image-alt': { enabled: true, tags: ['wcag2a', 'wcag111'] },
      'label': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'keyboard': { enabled: true, tags: ['wcag2a', 'wcag211'] },
      'focus-order-semantics': { enabled: true, tags: ['wcag2a', 'wcag241'] },
      
      // WCAG 2.1 Level AA rules
      'color-contrast-enhanced': { enabled: true, tags: ['wcag2aa', 'wcag146'] },
      'focus-visible': { enabled: true, tags: ['wcag2aa', 'wcag241'] },
      'link-in-text-block': { enabled: true, tags: ['wcag2aa', 'wcag141'] },
      
      // ARIA rules
      'aria-allowed-attr': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-hidden-body': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-hidden-focus': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-input-field-name': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-required-attr': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-roles': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-valid-attr': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'aria-valid-attr-value': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      
      // Form rules
      'form-field-multiple-labels': { enabled: true, tags: ['wcag2a', 'wcag332'] },
      'input-button-name': { enabled: true, tags: ['wcag2a', 'wcag412'] },
      'input-image-alt': { enabled: true, tags: ['wcag2a', 'wcag111'] },
      
      // Navigation rules
      'skip-link': { enabled: true, tags: ['wcag2a', 'wcag241'] },
      'bypass': { enabled: true, tags: ['wcag2a', 'wcag241'] },
      
      // Custom rules for our specific implementation
      'landmark-one-main': { enabled: true, tags: ['wcag2a'] },
      'landmark-complementary-is-top-level': { enabled: true, tags: ['wcag2a'] },
      'landmark-main-is-top-level': { enabled: true, tags: ['wcag2a'] },
      'landmark-no-duplicate-banner': { enabled: true, tags: ['wcag2a'] },
      'landmark-no-duplicate-contentinfo': { enabled: true, tags: ['wcag2a'] },
      'landmark-unique': { enabled: true, tags: ['wcag2a'] },
    },
    
    // Test environment configuration
    environment: {
      // Test in different viewport sizes
      viewports: [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' }
      ],
      
      // Test with different user preferences
      preferences: [
        { 'prefers-reduced-motion': 'reduce' },
        { 'prefers-contrast': 'high' },
        { 'prefers-color-scheme': 'dark' }
      ]
    },
    
    // Pages to test
    testPages: [
      '/',
      '/about',
      '/contact',
      '/services',
      '/portfolio',
      '/blog',
      '/privacy',
      '/terms'
    ],
    
    // Test scenarios
    scenarios: [
      {
        name: 'form-interaction',
        description: 'Test form accessibility during interaction',
        actions: [
          { type: 'click', selector: 'input[name="name"]' },
          { type: 'type', selector: 'input[name="name"]', text: 'Test User' },
          { type: 'click', selector: 'input[name="email"]' },
          { type: 'type', selector: 'input[name="email"]', text: 'invalid-email' },
          { type: 'click', selector: 'button[type="submit"]' }
        ]
      },
      {
        name: 'navigation-keyboard',
        description: 'Test keyboard navigation',
        actions: [
          { type: 'key', key: 'Tab' },
          { type: 'key', key: 'Tab' },
          { type: 'key', key: 'Enter' },
          { type: 'key', key: 'Escape' }
        ]
      },
      {
        name: 'skip-links',
        description: 'Test skip links functionality',
        actions: [
          { type: 'key', key: 'Tab' },
          { type: 'key', key: 'Enter' }
        ]
      }
    ]
  },
  
  // Lighthouse configuration
  lighthouse: {
    // Accessibility audit configuration
    accessibility: {
      // Performance budgets for accessibility
      budgets: [
        {
          resourceType: 'total',
          budget: 500 // Total resources should not impact accessibility
        }
      ],
      
      // Accessibility thresholds
      thresholds: {
        accessibility: 95, // Minimum accessibility score
        'best-practices': 90,
        seo: 90
      },
      
      // Custom accessibility audits
      customAudits: [
        'skip-link-focus',
        'aria-live-region-functionality',
        'focus-management',
        'keyboard-navigation'
      ]
    },
    
    // Testing configuration
    config: {
      extends: 'lighthouse:default',
      settings: {
        onlyAudits: [
          'accesskeys',
          'aria-allowed-attr',
          'aria-hidden-body',
          'aria-hidden-focus',
          'aria-input-field-name',
          'aria-required-attr',
          'aria-roles',
          'aria-valid-attr',
          'aria-valid-attr-value',
          'button-name',
          'bypass',
          'color-contrast',
          'definition-list',
          'dlitem',
          'document-title',
          'duplicate-id',
          'form-field-multiple-labels',
          'frame-title',
          'heading-order',
          'html-has-lang',
          'html-lang-valid',
          'image-alt',
          'input-image-alt',
          'label',
          'landmark-one-main',
          'link-name',
          'list',
          'listitem',
          'meta-refresh',
          'meta-viewport',
          'object-alt',
          'skip-link',
          'tabindex',
          'td-headers-attr',
          'th-has-data-cells',
          'valid-lang'
        ]
      }
    }
  },
  
  // Testing workflow configuration
  workflow: {
    // When to run tests
    triggers: [
      'pre-commit',
      'pre-push',
      'pull-request',
      'deployment',
      'scheduled'
    ],
    
    // Test environments
    environments: {
      development: {
        baseUrl: 'http://localhost:4321',
        parallel: true,
        retries: 2
      },
      staging: {
        baseUrl: process.env.STAGING_URL || 'https://staging.example.com',
        parallel: false,
        retries: 3
      },
      production: {
        baseUrl: process.env.PRODUCTION_URL || 'https://example.com',
        parallel: false,
        retries: 1
      }
    },
    
    // Reporting configuration
    reporting: {
      formats: ['json', 'html', 'junit'],
      outputDir: './accessibility-reports',
      includeScreenshots: true,
      generateTrends: true
    },
    
    // Alert configuration
    alerts: {
      slack: {
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#accessibility-alerts'
      },
      email: {
        recipients: process.env.ACCESSIBILITY_ALERT_EMAILS?.split(',') || [],
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true
        }
      }
    }
  },
  
  // Custom accessibility checks
  customChecks: {
    // Focus management verification
    focusManagement: {
      enabled: true,
      checks: [
        'skip-links-functional',
        'focus-trap-working',
        'focus-restoration',
        'keyboard-navigation-complete'
      ]
    },
    
    // ARIA live regions verification
    liveRegions: {
      enabled: true,
      checks: [
        'live-region-announcements',
        'polite-vs-assertive-usage',
        'aria-atomic-proper-usage'
      ]
    },
    
    // Color contrast verification
    colorContrast: {
      enabled: true,
      minimumRatio: {
        normal: 4.5,
        large: 3.0,
        enhanced: 7.0
      }
    },
    
    // Animation and motion verification
    motionAccessibility: {
      enabled: true,
      checks: [
        'prefers-reduced-motion-respected',
        'animation-duration-limits',
        'motion-triggered-interactions'
      ]
    }
  }
}; 