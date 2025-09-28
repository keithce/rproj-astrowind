declare module '@pagefind/default-ui' {
  export class PagefindUI {
    constructor(options?: {
      bundlePath?: string;
      baseUrl?: string;
      element?: string | HTMLElement;
      showImages?: boolean;
      showSubResults?: boolean;
      excerptLength?: number;
      processResult?: (result: Record<string, unknown>) => Record<string, unknown>;
      processTerm?: (term: string) => string;
      showEmptyFilters?: boolean;
      resetStyles?: boolean;
      translations?: Record<string, string>;
      forceLanguages?: string[];
      highlightParam?: string;
      debounceTimeoutMs?: number;
      mergeIndex?: string[];
    });

    triggerSearch(query: string): void;
    triggerFilters(filters: Record<string, string[]>): void;
    getResultCount(): Promise<number>;
    destroy(): void;
  }
}
