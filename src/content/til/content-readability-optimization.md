---
title: 'Content Readability Analysis and Optimization'
date: 2024-11-15
tags: ['content', 'seo', 'writing', 'accessibility']
description: 'Today I learned how to analyze and improve content readability using Flesch-Kincaid scores, sentence length metrics, and automated content auditing.'
draft: false
---

# Content Readability Analysis and Optimization

Web content should be accessible to readers of all skill levels. I built a readability analyzer that measures key metrics and provides actionable recommendations.

## Key Metrics

Target these readability scores:

| Metric              | Target      | Why                 |
| ------------------- | ----------- | ------------------- |
| Flesch Reading Ease | 60+         | 8th-9th grade level |
| Avg Sentence Length | 15-20 words | Easier to scan      |
| Passive Voice       | <20%        | More direct         |
| Paragraph Length    | 50-75 words | Digestible chunks   |

## Analysis Script

Parse content and calculate metrics:

```javascript
// src/utils/readability-analyzer.ts
export function analyzeReadability(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const flesch = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  return {
    flesch: Math.round(flesch),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    totalWords: words.length,
    totalSentences: sentences.length,
    grade: fleschToGrade(flesch),
  };
}
```

## Passive Voice Detection

Find and flag passive constructions:

```javascript
const passivePatterns = [/\b(is|are|was|were|been|being)\s+\w+ed\b/gi, /\b(is|are|was|were|been|being)\s+\w+en\b/gi];

export function findPassiveVoice(text) {
  const matches = [];
  passivePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({
        text: match[0],
        index: match.index,
        suggestion: 'Consider rewriting in active voice',
      });
    }
  });
  return matches;
}
```

## Long Sentence Detection

Flag sentences that need splitting:

```javascript
export function findLongSentences(text, maxWords = 25) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  return sentences
    .map((sentence, index) => ({
      sentence: sentence.trim(),
      wordCount: sentence.split(/\s+/).length,
      index,
    }))
    .filter(s => s.wordCount > maxWords);
}
```

## Automated Content Audit

Run analysis on all content pages:

```javascript
// scripts/content-analyzer.js
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import matter from 'gray-matter';

async function auditContent() {
  const files = await glob('src/content/**/*.md');
  const results = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const { content: body } = matter(content);
    const analysis = analyzeReadability(body);

    results.push({
      file,
      ...analysis,
      passesTargets: analysis.flesch >= 60 && analysis.avgSentenceLength <= 20,
    });
  }

  return results;
}
```

## Word Substitutions

Replace complex words with simpler alternatives:

```javascript
const simplifications = {
  utilize: 'use',
  facilitate: 'help',
  demonstrate: 'show',
  methodology: 'method',
  implementation: 'setup',
  comprehensive: 'complete',
};

export function suggestSimplifications(text) {
  return Object.entries(simplifications)
    .filter(([complex]) => text.toLowerCase().includes(complex))
    .map(([complex, simple]) => ({
      find: complex,
      replace: simple,
    }));
}
```

## Key Insight

Readability isn't dumbing down content—it's respecting your readers' time. Shorter sentences are easier to scan. Active voice is more direct. Simple words communicate faster. Measure readability metrics in CI to prevent regression.
