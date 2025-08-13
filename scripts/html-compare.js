#!/usr/bin/env node

/**
 * HTML Compare Utility
 *
 * Usage:
 *   node scripts/html-compare.js --left <url-or-file> --right <url-or-file> [--show]
 *
 * Compares two HTML documents after lightweight normalization and prints a summary
 * and the first few diffs. Use --show to print normalized HTML lengths and hashes.
 */

import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

async function readInput(src) {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
    return await res.text();
  }
  const filePath = path.resolve(process.cwd(), src);
  return await fs.readFile(filePath, 'utf8');
}

function normalizeHtml(html) {
  let s = html;
  // Remove extra whitespace between tags
  s = s.replace(/>\s+</g, '><');
  // Collapse whitespace runs
  s = s.replace(/\s{2,}/g, ' ');
  // Remove dev-only astro attributes and vite query params
  s = s.replace(/\?v=[a-f0-9]+/g, '');
  s = s.replace(/data-astro-source-file="[^"]*"/g, '');
  // Normalize self-closing tags spacing
  s = s.replace(/\s+\/>/g, '/>');
  return s.trim();
}

function hash(s) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

function findFirstDiff(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      const start = Math.max(0, i - 80);
      const end = Math.min(len, i + 80);
      return {
        index: i,
        left: a.slice(start, end),
        right: b.slice(start, end),
      };
    }
  }
  if (a.length !== b.length) {
    return { index: len, left: a.slice(len, len + 160), right: b.slice(len, len + 160) };
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const leftIdx = args.indexOf('--left');
  const rightIdx = args.indexOf('--right');
  const show = args.includes('--show');

  if (leftIdx === -1 || rightIdx === -1 || !args[leftIdx + 1] || !args[rightIdx + 1]) {
    console.error('Usage: node scripts/html-compare.js --left <url-or-file> --right <url-or-file> [--show]');
    process.exit(2);
  }

  const leftSrc = args[leftIdx + 1];
  const rightSrc = args[rightIdx + 1];

  const [leftRaw, rightRaw] = await Promise.all([readInput(leftSrc), readInput(rightSrc)]);
  const left = normalizeHtml(leftRaw);
  const right = normalizeHtml(rightRaw);

  if (show) {
    console.log(`Left length=${left.length} sha1=${hash(left)}`);
    console.log(`Right length=${right.length} sha1=${hash(right)}`);
  }

  if (left === right) {
    console.log('✅ HTML documents match after normalization');
    process.exit(0);
  }

  console.log('❌ HTML differs after normalization');
  const diff = findFirstDiff(left, right);
  if (diff) {
    console.log(`First difference at index ${diff.index}`);
    console.log('\nLeft snippet:\n');
    console.log(diff.left);
    console.log('\nRight snippet:\n');
    console.log(diff.right);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


