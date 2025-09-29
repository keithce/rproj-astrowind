declare module 'astro:content' {
  // Augment DataEntryMap for the resources data collection (Notion loader)
  interface DataEntryMap {
    resources: {
      id: string;
      slug: string;
      body: string;
      collection: 'resources';
      data: import('~/types/resources').ResourceData;
      render(): Promise<{
        Content: import('astro').ComponentInstance;
        headings: import('astro').MarkdownHeading[];
        remarkPluginFrontmatter: Record<string, any>;
      }>;
    };
  }
}
