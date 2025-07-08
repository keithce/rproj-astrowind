import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Taxonomy } from '~/types';

export interface TilEntry {
  id: string;
  slug: string;
  body: string;
  collection: string;
  data: {
    title: string;
    date: Date;
    tags: string[];
    description: string;
    draft?: boolean;
    image?: string;
  };
  render: () => Promise<{
    Content: import('astro').AstroComponentFactory;
    headings: {
      depth: number;
      slug: string;
      text: string;
    }[];
    remarkPluginFrontmatter: Record<string, any>;
  }>;
}

/**
 * Fetch all TIL entries
 */
export const fetchTilEntries = async (): Promise<TilEntry[]> => {
  const tilEntries = await getCollection('til');
  return tilEntries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()) as TilEntry[];
};

/**
 * Find all unique tags in TIL entries
 */
export const findTilTags = async (): Promise<Taxonomy[]> => {
  const entries = await fetchTilEntries();
  const tagMap = new Map<string, Taxonomy>();
  
  entries.forEach((entry) => {
    if (Array.isArray(entry.data.tags)) {
      entry.data.tags.forEach((tag) => {
        const slug = tag.toLowerCase().replace(/\s+/g, '-');
        tagMap.set(slug, { slug, title: tag });
      });
    }
  });
  
  return Array.from(tagMap.values());
};

/**
 * Find TIL entries by tag
 */
export const findTilEntriesByTag = async (tag: string): Promise<TilEntry[]> => {
  const entries = await fetchTilEntries();
  const normalizedTag = tag.toLowerCase();
  
  return entries.filter((entry) => 
    entry.data.tags.some(t => t.toLowerCase().replace(/\s+/g, '-') === normalizedTag)
  );
};

/**
 * Format date for display
 */
export const formatTilDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Group TIL entries by day for Kanban view
 */
export const groupTilEntriesByDay = async (entries?: TilEntry[]) => {
  const tilEntries = entries || await fetchTilEntries();
  const grouped = new Map<string, TilEntry[]>();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Initialize all days
  days.forEach(day => grouped.set(day, []));
  
  // Group entries by day
  tilEntries.forEach(entry => {
    const day = days[entry.data.date.getDay()];
    const existingEntries = grouped.get(day) || [];
    existingEntries.push(entry);
    grouped.set(day, existingEntries);
  });
  
  return grouped;
};