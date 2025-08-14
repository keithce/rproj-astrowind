/** @type {import('prettier').Config} */
module.exports = {
  // Basic formatting
  printWidth: 120,
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
  plugins: [require.resolve('prettier-plugin-astro'), require.resolve('prettier-plugin-tailwindcss')],

  // Tailwind CSS class sorting
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
};
