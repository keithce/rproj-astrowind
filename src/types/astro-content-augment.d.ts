import type { RenderResult } from 'astro';

declare module 'astro:content' {
  // Augment ContentEntryMap for the resources content collection (Notion loader)
  interface ContentEntryMap {
    resources: {
      id: string;
      slug: string;
      body: string;
      collection: 'resources';
      data: import('~/types/resources').ResourceData;
      render(): Promise<RenderResult>;
    };
  }
}
