import { describe, expect, test } from 'bun:test';
import { paginateItems, parsePageParam } from '../../src/utils/blog-pagination';

describe('parsePageParam', () => {
  test('treats a missing rest param as page 1', () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('')).toBe(1);
  });

  test('parses a positive page number', () => {
    expect(parsePageParam('2')).toBe(2);
  });

  test('rejects non-numeric or nested rest segments', () => {
    expect(parsePageParam('0')).toBeNull();
    expect(parsePageParam('02')).toBeNull();
    expect(parsePageParam('2/extra')).toBeNull();
    expect(parsePageParam('essay/foo')).toBeNull();
  });
});

describe('paginateItems', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  test('uses the base path for page 1 previous/next links', () => {
    const page = paginateItems(items, 1, 2, '/blog');
    expect(page?.data).toEqual(['a', 'b']);
    expect(page?.url.prev).toBeUndefined();
    expect(page?.url.next).toBe('/blog/2');
  });

  test('does not emit /blog/1 as a previous URL', () => {
    const page = paginateItems(items, 2, 2, '/blog');
    expect(page?.url.prev).toBe('/blog');
    expect(page?.url.next).toBe('/blog/3');
  });

  test('returns null for a page past the last page', () => {
    expect(paginateItems(items, 99, 2, '/blog')).toBeNull();
  });
});
