export interface RrResourceData {
  Name?: string;
  Source?: string;
  'User Defined URL'?: string;
  Category?: string[];
  Type?: string[];
  Tags?: string[];
  Keywords?: string[];
  Status?: 'Needs Review' | 'Writing' | 'Needs Update' | 'Up-to-Date';
  Length?: 'Short' | 'Medium' | 'Long';
  'AI summary'?: string;
  'Last Updated'?: Date | string;
  'Skill Level'?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Any';
  Favorite?: boolean;
}

/**
 * Type guard to check if an object is RrResourceData
 */
export function isRrResourceData(obj: unknown): obj is RrResourceData {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const data = obj as Record<string, unknown>;

  // Check if it has at least some of the expected properties
  // We don't require all properties to be present since they're optional
  const hasValidProperties =
    (data.Name === undefined || typeof data.Name === 'string') &&
    (data.Source === undefined || typeof data.Source === 'string') &&
    (data['User Defined URL'] === undefined || typeof data['User Defined URL'] === 'string') &&
    (data.Category === undefined || Array.isArray(data.Category)) &&
    (data.Type === undefined || Array.isArray(data.Type)) &&
    (data.Tags === undefined || Array.isArray(data.Tags)) &&
    (data.Keywords === undefined || Array.isArray(data.Keywords)) &&
    (data.Status === undefined ||
      ['Needs Review', 'Writing', 'Needs Update', 'Up-to-Date'].includes(data.Status as string)) &&
    (data.Length === undefined || ['Short', 'Medium', 'Long'].includes(data.Length as string)) &&
    (data['AI summary'] === undefined || typeof data['AI summary'] === 'string') &&
    (data['Last Updated'] === undefined ||
      typeof data['Last Updated'] === 'string' ||
      data['Last Updated'] instanceof Date) &&
    (data['Skill Level'] === undefined ||
      ['Beginner', 'Intermediate', 'Advanced', 'Any'].includes(data['Skill Level'] as string)) &&
    (data.Favorite === undefined || typeof data.Favorite === 'boolean');

  return hasValidProperties;
}
