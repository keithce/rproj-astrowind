import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Taxonomy } from '~/types';

/**
 * Weekly date range type
 */
export interface WeeklyDateRange {
  startDate: Date;
  endDate: Date;
}

export type TilEntry = CollectionEntry<'til'>;

/**
 * Fetch all TIL entries
 */
export const fetchTilEntries = async (): Promise<TilEntry[]> => {
  const tilEntries = await getCollection('til', ({ data }) => {
    return !data.draft;
  });
  return tilEntries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()) as TilEntry[];
};

/**
 * Find all unique tags in TIL entries
 */
export const findTilTags = async (): Promise<Taxonomy[]> => {
  const entries = await fetchTilEntries();
  const tagMap = new Map<string, Taxonomy>();

  entries.forEach(entry => {
    if (Array.isArray(entry.data.tags)) {
      entry.data.tags.forEach(tag => {
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

  return entries.filter(entry => entry.data.tags.some(t => t.toLowerCase().replace(/\s+/g, '-') === normalizedTag));
};

/**
 * Format date for display
 */
export const formatTilDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Group TIL entries by day for Kanban view
 */
export const groupTilEntriesByDay = async (entries?: TilEntry[]) => {
  const tilEntries = entries || (await fetchTilEntries());
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

/**
 * Calculate the Monday-Sunday range for a given week
 */
export const getWeekRange = (date: Date): WeeklyDateRange => {
  const startDate = new Date(date);
  // Get monday of the week (or previous monday if date is sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Filter TIL entries for a specific week
 */
export const getEntriesForWeek = async (weekDate: Date): Promise<TilEntry[]> => {
  const { startDate, endDate } = getWeekRange(weekDate);
  const entries = await fetchTilEntries();

  return entries.filter(entry => {
    const entryDate = entry.data.date;
    return entryDate >= startDate && entryDate <= endDate;
  });
};
