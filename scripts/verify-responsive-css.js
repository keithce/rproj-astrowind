#!/usr/bin/env node

/**
 * Responsive CSS Build Verification
 *
 * Guards against minifiers silently discarding Tailwind's responsive variants.
 *
 * Tailwind v4 emits every `sm:`/`md:`/`lg:`/`xl:`/`2xl:` utility inside CSS
 * Media Queries Level 4 range syntax — `@media (width>=64rem)`. csso 5 cannot
 * parse that media condition and drops the whole block without warning, which
 * once stripped every responsive utility from the production build and left the
 * site rendering at base (mobile) styles on all viewports. The build still
 * succeeded and the CSS still looked valid, so nothing caught it.
 *
 * This runs against the built CSS and fails loudly if the breakpoints are gone.
 */

import fs from 'fs/promises';
import path from 'path';

const CSS_DIR = path.resolve(process.cwd(), 'dist/client/_astro');

// Tailwind's default breakpoints, in the range syntax v4 emits. A build that
// uses any responsive utility at all must contain several of these.
const MIN_DISTINCT_BREAKPOINTS = 3;
const MIN_RESPONSIVE_SELECTORS = 10;

// Matches both the modern range syntax Tailwind v4 emits and the legacy form a
// minifier may lower it to — either is fine, silence is not.
const BREAKPOINT_MEDIA = /@media[^{]*?\(\s*(?:width\s*[<>]=?|(?:min|max)-width\s*:)[^)]*\)/g;
const RESPONSIVE_SELECTOR = /\.(?:sm|md|lg|xl|2xl)\\:/g;

async function readCssFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await readCssFiles(full)));
    else if (entry.name.endsWith('.css')) files.push({ name: entry.name, css: await fs.readFile(full, 'utf8') });
  }
  return files;
}

let files;
try {
  files = await readCssFiles(CSS_DIR);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`✗ No built CSS at ${CSS_DIR}\n\n  Run \`bun run build\` before this check.\n`);
    process.exit(1);
  }
  throw error;
}

if (files.length === 0) {
  console.error(`✗ No .css files under ${CSS_DIR} — did the build emit any stylesheets?`);
  process.exit(1);
}

const breakpoints = new Set();
let responsiveSelectors = 0;

for (const { css } of files) {
  for (const match of css.matchAll(BREAKPOINT_MEDIA)) breakpoints.add(match[0].replace(/\s+/g, ''));
  responsiveSelectors += (css.match(RESPONSIVE_SELECTOR) ?? []).length;
}

const problems = [];
if (breakpoints.size < MIN_DISTINCT_BREAKPOINTS) {
  problems.push(
    `expected at least ${MIN_DISTINCT_BREAKPOINTS} distinct breakpoint media queries, found ${breakpoints.size}`
  );
}
if (responsiveSelectors < MIN_RESPONSIVE_SELECTORS) {
  problems.push(
    `expected at least ${MIN_RESPONSIVE_SELECTORS} responsive utility selectors, found ${responsiveSelectors}`
  );
}

if (problems.length > 0) {
  console.error(`✗ Responsive CSS missing from the build (${files.length} CSS files checked)\n`);
  for (const problem of problems) console.error(`  · ${problem}`);
  console.error(
    `\n  The most likely cause is a CSS minifier discarding \`@media (width>=…)\`` +
      `\n  blocks it cannot parse. See the CSS option passed to astro-compress in` +
      `\n  astro.config.ts — csso does not support range syntax; lightningcss does.\n`
  );
  process.exit(1);
}

console.log(
  `✓ Responsive CSS intact — ${breakpoints.size} breakpoints, ` +
    `${responsiveSelectors} responsive selectors across ${files.length} CSS files.`
);
