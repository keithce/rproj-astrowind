import { describe, expect, test } from 'bun:test';
import {
  editorialFrontmatterFromRaw,
  parseEditorialManifest,
  parseMarkdownDocument,
} from '../../src/utils/frequency-editorial';

describe('parseEditorialManifest', () => {
  test('accepts the public_editorial_v1 contract', () => {
    const manifest = parseEditorialManifest(
      JSON.stringify({
        version: 'public_editorial_v1',
        items: [
          {
            slug: 'phase-four-fixture',
            path: 'phase-four-fixture.md',
            title: 'Phase Four Fixture',
            kind: 'experiment_recap',
            publishedAt: Date.parse('2026-03-31T00:00:00.000Z'),
            evidenceStatus: 'mixed',
          },
        ],
      })
    );

    expect(manifest.items).toHaveLength(1);
    expect(manifest.items[0]?.slug).toBe('phase-four-fixture');
  });

  test('rejects a missing contract version', () => {
    expect(() => parseEditorialManifest(JSON.stringify({ items: [] }))).toThrow(
      'Editorial manifest is missing the public_editorial_v1 contract.'
    );
  });
});

describe('parseMarkdownDocument', () => {
  test('splits frontmatter from the body', () => {
    const parsed = parseMarkdownDocument('---\ntitle: Hello\n---\n\nBody copy.\n');
    expect(parsed.frontmatter.title).toBe('Hello');
    expect(parsed.body.trim()).toBe('Body copy.');
  });
});

describe('editorialFrontmatterFromRaw', () => {
  const fallback = {
    slug: 'phase-four-fixture',
    title: 'Phase Four Fixture',
    kind: 'experiment_recap' as const,
    publishedAt: Date.parse('2026-03-31T00:00:00.000Z'),
    evidenceStatus: 'mixed' as const,
  };

  test('requires a valid canonical URL', () => {
    expect(() => editorialFrontmatterFromRaw({ title: 'Hello' }, fallback)).toThrow(
      'missing a valid canonicalAppUrl'
    );
  });

  test('keeps explicit canonical and dek values', () => {
    const data = editorialFrontmatterFromRaw(
      {
        title: 'Named',
        dek: 'A short dek.',
        canonicalAppUrl: 'https://app.resonantprojects.art/editorial/fixture-phase-four-id',
        whyItMatters: 'Testability.',
        uncertaintySummary: 'It is a fixture.',
      },
      fallback
    );

    expect(data.title).toBe('Named');
    expect(data.dek).toBe('A short dek.');
    expect(data.canonicalAppUrl).toBe('https://app.resonantprojects.art/editorial/fixture-phase-four-id');
  });
});
