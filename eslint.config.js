import astroEslintParser from 'astro-eslint-parser';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroEslintParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      ...eslintPluginAstro.configs['flat/recommended'].rules,
      'astro/no-conflict-set-directives': 'error',
      'astro/no-unused-define-vars-in-style': 'error',
      'astro/no-set-html-directive': 'warn',
      'astro/semi': ['error', 'always'],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Handled by TypeScript
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      // Dependencies
      'node_modules/**',
      '.pnpm/**',
      
      // Build outputs
      'dist/**',
      '.astro/**',
      'build/**',
      'out/**',
      '.vercel/**',
      '.netlify/**',
      '.output/**',
      
      // Vendor code (third-party)
      'vendor/**',
      'react-email-starter/**',
      
      // Generated files
      '**/*.min.js',
      '**/*.min.css',
      '**/*.min.ts',
      '**/*.min.tsx',
      
      // Configuration files
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.cjs',
      '**/*.config.mjs',
      
      // Package files
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
      
      // Environment files
      '.env*',
      
      // Logs
      '**/*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      
      // Coverage directory
      'coverage/**',
      '**/*.lcov',
      
      // Cache directories
      '.cache/**',
      '.parcel-cache/**',
      '.rpt2_cache/**',
      '.rts2_cache_cjs/**',
      '.rts2_cache_es/**',
      '.rts2_cache_umd/**',
      
      // Temporary folders
      'tmp/**',
      'temp/**',
      
      // Editor directories
      '.vscode/**',
      '.idea/**',
      
      // OS generated files
      '.DS_Store',
      '.DS_Store?',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
      'ehthumbs.db',
      'Thumbs.db',
      
      // Public assets
      'public/**',
      
      // Generated documentation
      'docs/generated/**',
      
      // Lock files
      '**/*.lock',
      
      // Minified files
      '**/*.min.*',
      
      // Bundle files
      '**/*.bundle.js',
      '**/*.bundle.css',
      
      // Source maps
      '**/*.map',
      
      // Compiled files
      '**/*.compiled.js',
      '**/*.compiled.css',
      
      // Partytown files
      '**/partytown*.js',
      
      // Pagefind files
      '**/pagefind*.js',
      
      // Build artifacts
      '.vercel/**',
      '.netlify/**',
      '.output/**',
      'dist/**',
      'build/**',
      'out/**',
      
      // Generated types
      '**/*.d.ts',
      'types.generated.d.ts',
      
      // Scripts (optional - can be linted if needed)
      'scripts/**/*.js',
    ],
  },
];
