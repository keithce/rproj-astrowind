import { getCollection, getLiveCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type ResourceEntry = CollectionEntry<'resources'>;

/**
 * Fetch all RR Resource entries
 */
export const fetchResourceEntries = async (): Promise<ResourceEntry[]> => {
  try {
    // Try stable content first
    const getCollectionLoose = getCollection as unknown as (c: string) => Promise<ResourceEntry[]>;
    const entries = await getCollectionLoose('resources');
    if (Array.isArray(entries) && entries.length > 0) {
      return entries.sort((a, b) => {
        // Sort by name alphabetically as a default
        const nameA = (a.data as any).Name || '';
        const nameB = (b.data as any).Name || '';
        return nameA.localeCompare(nameB);
      });
    }
  } catch {
    // Stable collection failed, trying live collection
  }

  try {
    // Fall back to live collection
    const live = (await getLiveCollection('resources' as unknown as string)) as unknown as {
      entries?: ResourceEntry[];
      error?: Error | null;
    };

    if (live?.error) {
      return [];
    }

    const entries = Array.isArray(live?.entries) ? live!.entries : [];

    return entries.sort((a, b) => {
      // Sort by name alphabetically as a default
      const nameA = (a.data as any).Name || '';
      const nameB = (b.data as any).Name || '';
      return nameA.localeCompare(nameB);
    });
  } catch {
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

  entries.forEach((entry) => {
    const data = entry.data as any;
    const categories = data.Category;

    if (Array.isArray(categories)) {
      categories.forEach((category) => {
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

  entries.forEach((entry) => {
    const data = entry.data as any;
    const types = data.Type;

    if (Array.isArray(types)) {
      types.forEach((type) => {
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

  return entries.filter((entry) => {
    const data = entry.data as any;
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

  return entries.filter((entry) => {
    const data = entry.data as any;
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

  return entries.filter((entry) => {
    const data = entry.data as any;
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

  return entries.filter((entry) => {
    const data = entry.data as any;
    const name = data.Name || '';
    const summary = data['AI summary'] || '';
    const categories = Array.isArray(data.Category) ? data.Category : [data.Category];
    const types = Array.isArray(data.Type) ? data.Type : [data.Type];

    return (
      name.toLowerCase().includes(searchTerm) ||
      summary.toLowerCase().includes(searchTerm) ||
      categories.some((cat: string) => cat?.toLowerCase().includes(searchTerm)) ||
      types.some((type: string) => type?.toLowerCase().includes(searchTerm))
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
    entries = entries.filter((entry) => {
      const data = entry.data as any;
      const categories = data.Category;
      return Array.isArray(categories) ? categories.includes(options.category) : categories === options.category;
    });
  }

  // Apply type filter
  if (options.type) {
    entries = entries.filter((entry) => {
      const data = entry.data as any;
      const types = data.Type;
      return Array.isArray(types) ? types.includes(options.type) : types === options.type;
    });
  }

  // Apply search filter
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    entries = entries.filter((entry) => {
      const data = entry.data as any;
      const name = data.Name || '';
      const summary = data['AI summary'] || '';
      const categories = Array.isArray(data.Category) ? data.Category : [data.Category];
      const types = Array.isArray(data.Type) ? data.Type : [data.Type];

      return (
        name.toLowerCase().includes(searchTerm) ||
        summary.toLowerCase().includes(searchTerm) ||
        categories.some((cat: string) => cat?.toLowerCase().includes(searchTerm)) ||
        types.some((type: string) => type?.toLowerCase().includes(searchTerm))
      );
    });
  }

  return entries;
};
