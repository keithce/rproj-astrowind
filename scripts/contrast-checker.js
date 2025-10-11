#!/usr/bin/env node

/**
 * Contrast Checker Utility
 *
 * Validates WCAG 2.1 contrast ratios for the migrated brand color system
 * Can be run independently without browser automation
 */

// Brand color palette
const BRAND_COLORS = {
  50: '#f1e9f0',
  100: '#e2d4e0',
  200: '#c5a9c1',
  300: '#a87da3',
  400: '#8b5284',
  500: '#6e2765',
  600: '#581f51',
  700: '#42173d',
  800: '#2c1028',
  900: '#160814',
  950: '#0a040a',
};

// WCAG contrast thresholds
const THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
};

// Color combinations to test
const COLOR_COMBINATIONS = {
  light: {
    'Background/Foreground': [BRAND_COLORS[50], BRAND_COLORS[900]],
    'Primary/Primary Foreground': [BRAND_COLORS[600], BRAND_COLORS[50]],
    'Secondary/Secondary Foreground': [BRAND_COLORS[400], BRAND_COLORS[50]],
    'Muted/Muted Foreground': [BRAND_COLORS[200], BRAND_COLORS[700]],
    'Accent/Accent Foreground': [BRAND_COLORS[500], BRAND_COLORS[50]],
    'Border/Foreground': [BRAND_COLORS[200], BRAND_COLORS[900]],
  },
  dark: {
    'Background/Foreground': [BRAND_COLORS[950], BRAND_COLORS[100]],
    'Primary/Primary Foreground': [BRAND_COLORS[400], BRAND_COLORS[950]],
    'Secondary/Secondary Foreground': [BRAND_COLORS[600], BRAND_COLORS[100]],
    'Muted/Muted Foreground': [BRAND_COLORS[800], BRAND_COLORS[300]],
    'Accent/Accent Foreground': [BRAND_COLORS[300], BRAND_COLORS[950]],
    'Border/Foreground': [BRAND_COLORS[800], BRAND_COLORS[100]],
  },
};

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse hex color to RGB values
 */
function parseHexColor(hex) {
  const cleanHex = hex.replace('#', '');
  return [
    parseInt(cleanHex.substr(0, 2), 16),
    parseInt(cleanHex.substr(2, 2), 16),
    parseInt(cleanHex.substr(4, 2), 16),
  ];
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(color1, color2) {
  const [r1, g1, b1] = parseHexColor(color1);
  const [r2, g2, b2] = parseHexColor(color2);

  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check WCAG compliance for a contrast ratio
 */
function checkCompliance(ratio) {
  return {
    AA_NORMAL: ratio >= THRESHOLDS.AA_NORMAL,
    AA_LARGE: ratio >= THRESHOLDS.AA_LARGE,
    AAA_NORMAL: ratio >= THRESHOLDS.AAA_NORMAL,
    AAA_LARGE: ratio >= THRESHOLDS.AAA_LARGE,
  };
}

/**
 * Format compliance results for display
 */
function formatCompliance(compliance) {
  const symbols = {
    AA_NORMAL: compliance.AA_NORMAL ? '✅' : '❌',
    AA_LARGE: compliance.AA_LARGE ? '✅' : '❌',
    AAA_NORMAL: compliance.AAA_NORMAL ? '✅' : '❌',
    AAA_LARGE: compliance.AAA_LARGE ? '✅' : '❌',
  };

  return `AA Normal: ${symbols.AA_NORMAL} | AA Large: ${symbols.AA_LARGE} | AAA Normal: ${symbols.AAA_NORMAL} | AAA Large: ${symbols.AAA_LARGE}`;
}

/**
 * Test all color combinations
 */
function testAllCombinations() {
  console.log('🎨 Brand Color Contrast Analysis\n');
  console.log('Testing WCAG 2.1 compliance for migrated color system...\n');

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  Object.entries(COLOR_COMBINATIONS).forEach(([theme, combinations]) => {
    console.log(`\n📱 ${theme.toUpperCase()} THEME`);
    console.log('='.repeat(50));

    Object.entries(combinations).forEach(([name, [bg, fg]]) => {
      const ratio = calculateContrastRatio(bg, fg);
      const compliance = checkCompliance(ratio);

      totalTests++;
      if (compliance.AA_NORMAL) passedTests++;

      const result = {
        theme,
        combination: name,
        background: bg,
        foreground: fg,
        ratio: ratio.toFixed(2),
        compliance,
      };

      results.push(result);

      // Display result
      const status = compliance.AA_NORMAL ? '✅' : '❌';
      console.log(`\n${status} ${name}`);
      console.log(`   Background: ${bg} | Foreground: ${fg}`);
      console.log(`   Contrast Ratio: ${ratio.toFixed(2)}:1`);
      console.log(`   WCAG: ${formatCompliance(compliance)}`);

      if (!compliance.AA_NORMAL) {
        console.log(`   ⚠️  FAILS WCAG AA requirement (${THRESHOLDS.AA_NORMAL}:1 minimum)`);
      }
    });
  });

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed (AA): ${passedTests}`);
  console.log(`Failed (AA): ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Recommendations
  if (totalTests - passedTests > 0) {
    console.log('\n⚠️  RECOMMENDATIONS');
    console.log('='.repeat(50));
    results
      .filter(r => !r.compliance.AA_NORMAL)
      .forEach(result => {
        console.log(`• ${result.theme} theme - ${result.combination}: Consider adjusting colors for better contrast`);
      });
  } else {
    console.log('\n🎉 All color combinations pass WCAG AA standards!');
  }

  return results;
}

/**
 * Test specific color combination
 */
function testSpecificColors(bg, fg, name = 'Custom') {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`Background: ${bg} | Foreground: ${fg}`);

  const ratio = calculateContrastRatio(bg, fg);
  const compliance = checkCompliance(ratio);

  console.log(`Contrast Ratio: ${ratio.toFixed(2)}:1`);
  console.log(`WCAG Compliance: ${formatCompliance(compliance)}`);

  return { ratio, compliance };
}

/**
 * Display brand color palette
 */
function showPalette() {
  console.log('\n🎨 BRAND COLOR PALETTE');
  console.log('='.repeat(50));

  Object.entries(BRAND_COLORS).forEach(([shade, hex]) => {
    console.log(`--color-brand-${shade.padEnd(3)}: ${hex}  ${getColorDescription(shade)}`);
  });
}

/**
 * Get description for color shade
 */
function getColorDescription(shade) {
  const descriptions = {
    50: '(Lightest - backgrounds)',
    100: '(Very light - text on dark)',
    200: '(Light - borders, muted)',
    300: '(Light-medium - accents)',
    400: '(Medium - secondary)',
    500: '(Base brand - primary accent)',
    600: '(Medium-dark - primary)',
    700: '(Dark - muted text)',
    800: '(Very dark - text, borders)',
    900: '(Darkest - text on light)',
    950: '(Deepest - dark backgrounds)',
  };

  return descriptions[shade] || '';
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎨 Brand Color Contrast Checker

Usage:
  node contrast-checker.js [options]

Options:
  --help, -h          Show this help message
  --palette, -p       Show brand color palette
  --test <bg> <fg>    Test specific background/foreground combination
  
Examples:
  node contrast-checker.js                    # Test all combinations
  node contrast-checker.js --palette          # Show color palette
  node contrast-checker.js --test #f1e9f0 #160814  # Test specific colors
`);
    return;
  }

  if (args.includes('--palette') || args.includes('-p')) {
    showPalette();
    return;
  }

  const testIndex = args.indexOf('--test');
  if (testIndex !== -1 && args[testIndex + 1] && args[testIndex + 2]) {
    const bg = args[testIndex + 1];
    const fg = args[testIndex + 2];
    testSpecificColors(bg, fg, 'Custom Colors');
    return;
  }

  // Default: test all combinations
  testAllCombinations();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { calculateContrastRatio, checkCompliance, testAllCombinations, BRAND_COLORS };
