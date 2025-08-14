// Utility to extract a human-readable title from a Notion-backed collection entry
export function getNotionEntryTitle(entry: unknown): string {
  // Helper to read safely
  const obj = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
  const id = typeof obj.id === 'string' ? obj.id : '';
  const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : {};

  // Prefer flattened transformer (transformed-properties.title)
  const nameVal = data['Name'];
  if (typeof nameVal === 'string' && nameVal.trim().length > 0) {
    return nameVal.trim();
  }

  // Fallback: search raw Notion properties
  const props = data['properties'];
  if (props && typeof props === 'object') {
    const p = props as Record<string, unknown>;
    const nameProp = p['Name'] as Record<string, unknown> | undefined;
    if (nameProp && nameProp['type'] === 'title' && Array.isArray(nameProp['title'])) {
      const titleArr = nameProp['title'] as Array<unknown>;
      const text = titleArr
        .map(t => {
          const c = t && typeof t === 'object' ? (t as Record<string, unknown>) : {};
          return typeof c['plain_text'] === 'string' ? c['plain_text'] : '';
        })
        .join('')
        .trim();
      if (text) return text;
    }
    // Generic title search
    const anyTitle = Object.values(p).find(
      pp => pp && typeof pp === 'object' && (pp as Record<string, unknown>).type === 'title'
    ) as Record<string, unknown> | undefined;
    if (anyTitle && Array.isArray(anyTitle['title'])) {
      const titleArr = anyTitle['title'] as Array<unknown>;
      const text = titleArr
        .map(t => {
          const c = t && typeof t === 'object' ? (t as Record<string, unknown>) : {};
          return typeof c['plain_text'] === 'string' ? c['plain_text'] : '';
        })
        .join('')
        .trim();
      if (text) return text;
    }
  }

  return id || 'Untitled';
}
