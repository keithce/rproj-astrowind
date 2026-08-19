export function parsePageParam(page: string | undefined): number | null {
  if (page == null || page === '') return 1;
  if (!/^[1-9]\d*$/.test(page)) return null;
  return Number(page);
}

export interface PaginatedPage<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  url: {
    prev?: string;
    next?: string;
  };
}

export function paginateItems<T>(
  items: T[],
  pageNumber: number,
  pageSize: number,
  basePath: string
): PaginatedPage<T> | null {
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize));
  if (pageNumber < 1 || pageNumber > lastPage) {
    return null;
  }

  const start = (pageNumber - 1) * pageSize;
  const pageUrl = (n: number) => (n === 1 ? basePath : `${basePath}/${n}`);

  return {
    data: items.slice(start, start + pageSize),
    currentPage: pageNumber,
    lastPage,
    url: {
      prev: pageNumber > 1 ? pageUrl(pageNumber - 1) : undefined,
      next: pageNumber < lastPage ? pageUrl(pageNumber + 1) : undefined,
    },
  };
}
