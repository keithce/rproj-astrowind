import { describe, expect, test } from 'bun:test';
import { liveEssayFromRaw, parseEssayManifest } from '../../src/utils/frequency-essays';

describe('parseEssayManifest', () => {
  test('accepts the frequency_essays_v1 contract', () => {
    const manifest = parseEssayManifest(
      JSON.stringify({
        version: 'frequency_essays_v1',
        items: [
          {
            slug: 'listening-notes',
            path: 'listening-notes.md',
            title: 'Listening Notes',
            publishDate: '2026-04-01T00:00:00.000Z',
            category: 'music',
          },
        ],
      })
    );

    expect(manifest.items).toHaveLength(1);
    expect(manifest.items[0]?.slug).toBe('listening-notes');
  });

  test('rejects a missing contract version', () => {
    expect(() => parseEssayManifest(JSON.stringify({ items: [] }))).toThrow(
      'Essay manifest is missing the frequency_essays_v1 contract.'
    );
  });
});

describe('liveEssayFromRaw', () => {
  const item = {
    slug: 'listening-notes',
    path: 'listening-notes.md',
    title: 'Listening Notes',
    publishDate: '2026-04-01T00:00:00.000Z',
    category: 'music',
  };

  test('maps frontmatter onto a live essay', () => {
    const essay = liveEssayFromRaw(
      {
        title: 'Named Essay',
        excerpt: 'A short excerpt.',
        tags: ['mix', 'master'],
        draft: false,
      },
      item,
      '<p>Body</p>'
    );

    expect(essay.id).toBe('essay/listening-notes');
    expect(essay.title).toBe('Named Essay');
    expect(essay.excerpt).toBe('A short excerpt.');
    expect(essay.category).toBe('music');
    expect(essay.tags).toEqual(['mix', 'master']);
    expect(essay.html).toBe('<p>Body</p>');
  });
});
