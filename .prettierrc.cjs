/** @type {import('prettier').Config} */
module.exports = {
  // Basic formatting
  printWidth: 100,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,

  // Line length and wrapping
  proseWrap: 'preserve',

  // HTML/JSX formatting
  htmlWhitespaceSensitivity: 'css',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Plugins
  plugins: [
    require.resolve('prettier-plugin-astro'),
    require.resolve('prettier-plugin-tailwindcss'),
  ],

  // File-specific overrides
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
        printWidth: 100,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
  ],

  // Tailwind CSS class sorting
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
};
