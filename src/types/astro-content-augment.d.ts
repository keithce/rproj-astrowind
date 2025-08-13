declare module 'astro:content' {
  // Temporary augmentation so TypeScript recognizes the dynamic Notion collection before `astro sync` generates types
  interface ContentEntryMap {
    rrresources: any;
  }
}


