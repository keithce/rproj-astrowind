declare module 'astro:content' {
  // Augment DataEntryMap for the rrresources data collection (Notion loader)
  interface DataEntryMap {
    rrresources: {
      id: string;
      slug: string;
      body: string;
      collection: 'rrresources';
      data: import('~/types/rr-resources').RrResourceData;
      render(): Promise<{
        Content: import('astro').ComponentInstance;
        headings: import('astro').MarkdownHeading[];
        remarkPluginFrontmatter: Record<string, any>;
      }>;
    };
  }
}
