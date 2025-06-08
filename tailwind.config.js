import typographyPlugin from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      // Semantic color tokens for theme switching
      colors: {
        // Brand color palette (preserved from existing myColor)
        brand: {
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
        },
        // Semantic design tokens
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        'card-foreground': 'var(--color-card-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        // Legacy compatibility (for gradual migration)
        default: 'var(--aw-color-text-default)',
        'text-heading': 'var(--aw-color-text-heading)',
        'text-muted': 'var(--aw-color-text-muted)',
        page: 'var(--aw-color-bg-page)',
      },
      fontFamily: {
        sans: ['var(--font-family-primary, "Raleway Variable")', 'ui-sans-serif', 'system-ui'],
        serif: ['var(--font-family-serif, "Raleway Variable")', 'ui-serif', 'Georgia'],
        heading: ['var(--font-family-heading, "Raleway Variable")', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        fade: 'fadeInUp 1s both',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--starwind-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--starwind-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    typographyPlugin,
    // Custom intersect variant for animations
    function ({ addVariant }) {
      addVariant('intersect', '&:not([no-intersect])');
    },
  ],
  // V4 dark mode configuration
  darkMode: ['class'],
};
