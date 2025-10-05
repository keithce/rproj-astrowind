import { getCollection, getLiveCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { ResourceData } from '../types/resources';

export type ResourceEntry = CollectionEntry<'resources'>;

/**
 * Fetch all RR Resource entries
 */
export const fetchResourceEntries = async (): Promise<ResourceEntry[]> => {
  console.log('🔍 [RESOURCES] Starting to fetch resource entries...');
  try {
    // Try stable content first
    const getCollectionLoose = getCollection as unknown as (c: string) => Promise<ResourceEntry[]>;
    const entries = await getCollectionLoose('resources');
    console.log('🔍 [RESOURCES] Stable collection entries:', entries.length);
    if (Array.isArray(entries) && entries.length > 0) {
      const sorted = entries.sort((a, b) => {
        // Sort by name alphabetically as a default
        const nameA = (a.data as ResourceData).Name || '';
        const nameB = (b.data as ResourceData).Name || '';
        return nameA.localeCompare(nameB);
      });
      console.log('🔍 [RESOURCES] Returning stable collection entries:', sorted.length);
      return sorted;
    }
  } catch (error) {
    console.log('🔍 [RESOURCES] Stable collection failed:', error instanceof Error ? error.message : String(error));
    // Stable collection failed, trying live collection
  }

  try {
    // Fall back to live collection
    const live = (await getLiveCollection('resources' as unknown as string)) as unknown as {
      entries?: ResourceEntry[];
      error?: Error | null;
    };

    console.log('🔍 [RESOURCES] Live collection result:', {
      hasEntries: !!live?.entries,
      entriesLength: live?.entries?.length || 0,
      hasError: !!live?.error,
    });

    if (live?.error) {
      console.log('🔍 [RESOURCES] Live collection error:', live.error.message);
      return [];
    }

    const entries = Array.isArray(live?.entries) ? live.entries : [];
    console.log('🔍 [RESOURCES] Live collection entries:', entries.length);

    const sorted = entries.sort((a, b) => {
      // Sort by name alphabetically as a default
      const nameA = (a.data as ResourceData).Name || '';
      const nameB = (b.data as ResourceData).Name || '';
      return nameA.localeCompare(nameB);
    });
    console.log('🔍 [RESOURCES] Returning live collection entries:', sorted.length);
    return sorted;
  } catch (error) {
    console.log('🔍 [RESOURCES] Live collection failed:', error instanceof Error ? error.message : String(error));
    // Temporary fallback for development/testing
    return [];
  }
};

/**
 * Find all unique categories in RR Resource entries
 */
export const findResourceCategories = async (): Promise<string[]> => {
  const entries = await fetchResourceEntries();
  const categorySet = new Set<string>();

  entries.forEach(entry => {
    const data = entry.data as ResourceData;
    const categories = data.Category;

    if (Array.isArray(categories)) {
      categories.forEach(category => {
        if (category && typeof category === 'string') {
          categorySet.add(category);
        }
      });
    } else if (categories && typeof categories === 'string') {
      categorySet.add(categories);
    }
  });

  return Array.from(categorySet).sort();
};

/**
 * Find all unique types in RR Resource entries
 */
export const findResourceTypes = async (): Promise<string[]> => {
  const entries = await fetchResourceEntries();
  const typeSet = new Set<string>();

  entries.forEach(entry => {
    const data = entry.data as ResourceData;
    const types = data.Type;

    if (Array.isArray(types)) {
      types.forEach(type => {
        if (type && typeof type === 'string') {
          typeSet.add(type);
        }
      });
    } else if (types && typeof types === 'string') {
      typeSet.add(types);
    }
  });

  return Array.from(typeSet).sort();
};

/**
 * Filter RR Resource entries by category
 */
export const filterResourcesByCategory = async (category: string): Promise<ResourceEntry[]> => {
  const entries = await fetchResourceEntries();

  return entries.filter(entry => {
    const data = entry.data as ResourceData;
    const categories = data.Category;

    if (Array.isArray(categories)) {
      return categories.includes(category);
    }
    return categories === category;
  });
};

/**
 * Filter RR Resource entries by type
 */
export const filterResourcesByType = async (type: string): Promise<ResourceEntry[]> => {
  const entries = await fetchResourceEntries();

  return entries.filter(entry => {
    const data = entry.data as ResourceData;
    const types = data.Type;

    if (Array.isArray(types)) {
      return types.includes(type);
    }
    return types === type;
  });
};

/**
 * Filter RR Resource entries by both category and type
 */
export const filterResourcesByCategoryAndType = async (category: string, type: string): Promise<ResourceEntry[]> => {
  const entries = await fetchResourceEntries();

  return entries.filter(entry => {
    const data = entry.data as ResourceData;
    const categories = data.Category;
    const types = data.Type;

    const matchesCategory = Array.isArray(categories) ? categories.includes(category) : categories === category;

    const matchesType = Array.isArray(types) ? types.includes(type) : types === type;

    return matchesCategory && matchesType;
  });
};

/**
 * Search RR Resource entries by text query
 */
export const searchResources = async (query: string): Promise<ResourceEntry[]> => {
  const entries = await fetchResourceEntries();
  const searchTerm = query.toLowerCase();

  return entries.filter(entry => {
    const data = entry.data as ResourceData;
    const name = data.Name || '';
    const summary = data['AI summary'] || '';

    // Normalize categories to ensure they're strings
    const categories = Array.isArray(data.Category)
      ? data.Category.filter(Boolean).map(String)
      : data.Category
        ? [String(data.Category)]
        : [];

    // Normalize types to ensure they're strings
    const types = Array.isArray(data.Type)
      ? data.Type.filter(Boolean).map(String)
      : data.Type
        ? [String(data.Type)]
        : [];

    return (
      name.toLowerCase().includes(searchTerm) ||
      summary.toLowerCase().includes(searchTerm) ||
      categories.some((cat: string) => cat.toLowerCase().includes(searchTerm)) ||
      types.some((type: string) => type.toLowerCase().includes(searchTerm))
    );
  });
};

/**
 * Apply multiple filters to RR Resource entries
 */
export const filterResources = async (options: {
  category?: string;
  type?: string;
  search?: string;
}): Promise<ResourceEntry[]> => {
  let entries = await fetchResourceEntries();

  // Apply category filter
  if (options.category) {
    const category = options.category;
    entries = entries.filter(entry => {
      const data = entry.data as ResourceData;
      const categories = data.Category;
      return Array.isArray(categories) ? categories.includes(category) : categories === category;
    });
  }

  // Apply type filter
  if (options.type) {
    const type = options.type;
    entries = entries.filter(entry => {
      const data = entry.data as ResourceData;
      const types = data.Type;
      return Array.isArray(types) ? types.includes(type) : types === type;
    });
  }

  // Apply search filter
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    entries = entries.filter(entry => {
      const data = entry.data as ResourceData;
      const name = data.Name || '';
      const summary = data['AI summary'] || '';

      // Normalize categories to ensure they're strings
      const categories = Array.isArray(data.Category)
        ? data.Category.filter(Boolean).map(String)
        : data.Category
          ? [String(data.Category)]
          : [];

      // Normalize types to ensure they're strings
      const types = Array.isArray(data.Type)
        ? data.Type.filter(Boolean).map(String)
        : data.Type
          ? [String(data.Type)]
          : [];

      return (
        name.toLowerCase().includes(searchTerm) ||
        summary.toLowerCase().includes(searchTerm) ||
        categories.some((cat: string) => cat.toLowerCase().includes(searchTerm)) ||
        types.some((type: string) => type.toLowerCase().includes(searchTerm))
      );
    });
  }

  return entries;
};
