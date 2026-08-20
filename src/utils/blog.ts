import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Post, Taxonomy, MetaData } from '~/types';
import { APP_BLOG } from 'astrowind:config';
import { cleanSlug, trimSlash, POST_PERMALINK_PATTERN } from './permalinks';
import { loadLiveEditorialEntries, type LiveEditorialEntry } from '~/utils/frequency-editorial';
import { loadLiveEssays, type LiveEssay } from '~/utils/frequency-essays';

const generatePermalink = async ({
  id,
  slug,
  publishDate,
  category,
}: {
  id: string;
  slug: string;
  publishDate: Date;
  category: string | undefined;
}) => {
  const year = String(publishDate.getFullYear()).padStart(4, '0');
  const month = String(publishDate.getMonth() + 1).padStart(2, '0');
  const day = String(publishDate.getDate()).padStart(2, '0');
  const hour = String(publishDate.getHours()).padStart(2, '0');
  const minute = String(publishDate.getMinutes()).padStart(2, '0');
  const second = String(publishDate.getSeconds()).padStart(2, '0');

  const permalink = POST_PERMALINK_PATTERN.replace('%slug%', slug)
    .replace('%id%', id)
    .replace('%category%', category || '')
    .replace('%year%', year)
    .replace('%month%', month)
    .replace('%day%', day)
    .replace('%hour%', hour)
    .replace('%minute%', minute)
    .replace('%second%', second);

  return permalink
    .split('/')
    .map(el => trimSlash(el))
    .filter(el => !!el)
    .join('/');
};

const getNormalizedPost = async (post: CollectionEntry<'post'>): Promise<Post> => {
  const { id, data } = post;

  const {
    publishDate: rawPublishDate = new Date(),
    updateDate: rawUpdateDate,
    title,
    excerpt,
    image,
    tags: rawTags = [],
    category: rawCategory,
    author,
    draft = false,
    metadata = {},
  } = data;

  const slug = cleanSlug(id); // cleanSlug(rawSlug.split('/').pop());
  const publishDate = new Date(rawPublishDate);
  const updateDate = rawUpdateDate ? new Date(rawUpdateDate) : undefined;

  const category = rawCategory
    ? {
        slug: cleanSlug(rawCategory),
        title: rawCategory,
      }
    : undefined;

  const tags = rawTags.map((tag: string) => ({
    slug: cleanSlug(tag),
    title: tag,
  }));

  return {
    id,
    slug,
    permalink: await generatePermalink({ id, slug, publishDate, category: category?.slug }),

    publishDate,
    updateDate,

    title,
    excerpt,
    image,

    category,
    tags,
    author,

    draft,

    metadata: metadata as MetaData,
  };
};

const normalizeEditorialEntry = (
  entry: Pick<CollectionEntry<'editorial'> | LiveEditorialEntry, 'id' | 'data'>
): Post => {
  const kind = entry.data.kind.replaceAll('_', ' ');
  return {
    id: entry.id,
    slug: entry.id,
    permalink: `writing/${entry.id}`,
    publishDate: entry.data.publishedAt,
    title: entry.data.title,
    excerpt: entry.data.dek,
    category: { slug: 'writing', title: 'Writing' },
    tags: [{ slug: entry.data.kind.replaceAll('_', '-'), title: kind.replace(/\b\w/g, c => c.toUpperCase()) }],
    draft: false,
    metadata: {},
  };
};

const liveEssayToPost = async (essay: LiveEssay): Promise<Post> => {
  const slug = cleanSlug(essay.id);
  const category = essay.category
    ? {
        slug: cleanSlug(essay.category),
        title: essay.category,
      }
    : undefined;

  return {
    id: essay.id,
    slug,
    permalink: await generatePermalink({
      id: essay.id,
      slug,
      publishDate: essay.publishDate,
      category: category?.slug,
    }),
    publishDate: essay.publishDate,
    updateDate: essay.updateDate,
    title: essay.title,
    excerpt: essay.excerpt,
    image: essay.image,
    category,
    tags: essay.tags.map(tag => ({
      slug: cleanSlug(tag),
      title: tag,
    })),
    author: essay.author,
    draft: essay.draft,
    metadata: {},
    ...(essay.html ? { content: essay.html } : {}),
  };
};

const load = async function (): Promise<Array<Post>> {
  const [collectionPosts, liveEssays, liveEditorial] = await Promise.all([
    getCollection('post'),
    loadLiveEssays().catch(() => [] as LiveEssay[]),
    loadLiveEditorialEntries().catch(() => [] as LiveEditorialEntry[]),
  ]);

  const liveEssayIds = new Set(liveEssays.map(essay => essay.id));
  const postsToNormalize = collectionPosts.filter(post => !liveEssayIds.has(post.id));
  const normalizedLocalPosts = await Promise.all(postsToNormalize.map(post => getNormalizedPost(post)));
  const normalizedLiveEssays = await Promise.all(liveEssays.map(essay => liveEssayToPost(essay)));

  const byId = new Map<string, Post>();
  for (const post of normalizedLocalPosts) {
    byId.set(post.id, post);
  }
  for (const post of normalizedLiveEssays) {
    byId.set(post.id, post);
  }

  if (liveEditorial.length > 0) {
    for (const entry of liveEditorial) {
      byId.set(entry.id, normalizeEditorialEntry(entry));
    }
  } else {
    const editorialEntries = await getCollection('editorial');
    for (const entry of editorialEntries) {
      byId.set(entry.id, normalizeEditorialEntry(entry));
    }
  }

  return Array.from(byId.values())
    .sort((a, b) => b.publishDate.valueOf() - a.publishDate.valueOf())
    .filter(post => !post.draft);
};

const FETCH_POSTS_TTL_MS = 30_000;
let cachedPosts: { at: number; posts: Promise<Array<Post>> } | undefined;

/** */
export const isBlogEnabled = APP_BLOG.isEnabled;
export const isRelatedPostsEnabled = APP_BLOG.isRelatedPostsEnabled;
export const isBlogListRouteEnabled = APP_BLOG.list.isEnabled;
export const isBlogPostRouteEnabled = APP_BLOG.post.isEnabled;
export const isBlogCategoryRouteEnabled = APP_BLOG.category.isEnabled;
export const isBlogTagRouteEnabled = APP_BLOG.tag.isEnabled;

export const blogListRobots = APP_BLOG.list.robots;
export const blogPostRobots = APP_BLOG.post.robots;
export const blogCategoryRobots = APP_BLOG.category.robots;
export const blogTagRobots = APP_BLOG.tag.robots;

export const blogPostsPerPage = APP_BLOG?.postsPerPage;

/** */
export const fetchPosts = async (): Promise<Array<Post>> => {
  if (cachedPosts && Date.now() - cachedPosts.at < FETCH_POSTS_TTL_MS) {
    return cachedPosts.posts;
  }

  const posts = load().catch(error => {
    cachedPosts = undefined;
    throw error;
  });
  cachedPosts = { at: Date.now(), posts };
  return posts;
};

/** */
export const findPostByPermalink = async (permalink: string): Promise<Post | undefined> => {
  const posts = await fetchPosts();
  return posts.find(post => post.permalink === permalink || post.slug === permalink);
};

/** */
export const findPostsBySlugs = async (slugs: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(slugs)) return [];

  const posts = await fetchPosts();

  return slugs.reduce(function (r: Array<Post>, slug: string) {
    posts.some(function (post: Post) {
      return slug === post.slug && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findPostsByIds = async (ids: Array<string>): Promise<Array<Post>> => {
  if (!Array.isArray(ids)) return [];

  const posts = await fetchPosts();

  return ids.reduce(function (r: Array<Post>, id: string) {
    posts.some(function (post: Post) {
      return id === post.id && r.push(post);
    });
    return r;
  }, []);
};

/** */
export const findLatestPosts = async ({ count }: { count?: number }): Promise<Array<Post>> => {
  const _count = count || 4;
  const posts = await fetchPosts();

  return posts ? posts.slice(0, _count) : [];
};

/** */
export const findCategories = async (): Promise<Taxonomy[]> => {
  const posts = await fetchPosts();
  const categoryMap = new Map<string, Taxonomy>();
  posts.forEach(post => {
    if (post.category?.slug && post.category?.title) {
      categoryMap.set(post.category.slug, { slug: post.category.slug, title: post.category.title });
    }
  });
  return Array.from(categoryMap.values());
};

/** */
export const findTags = async (): Promise<Taxonomy[]> => {
  const posts = await fetchPosts();
  const tagMap = new Map<string, Taxonomy>();
  posts.forEach(post => {
    if (Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        if (tag?.slug && tag?.title) {
          tagMap.set(tag.slug, { slug: tag.slug, title: tag.title });
        }
      });
    }
  });
  return Array.from(tagMap.values());
};

/** */
export async function getRelatedPosts(originalPost: Post, maxResults: number = 4): Promise<Post[]> {
  const allPosts = await fetchPosts();
  const originalTagsSet = new Set(originalPost.tags ? originalPost.tags.map(tag => tag.slug) : []);

  const postsWithScores = allPosts.reduce((acc: { post: Post; score: number }[], iteratedPost: Post) => {
    if (iteratedPost.slug === originalPost.slug) return acc;

    let score = 0;
    if (iteratedPost.category && originalPost.category && iteratedPost.category.slug === originalPost.category.slug) {
      score += 5;
    }

    if (iteratedPost.tags) {
      iteratedPost.tags.forEach(tag => {
        if (originalTagsSet.has(tag.slug)) {
          score += 1;
        }
      });
    }

    acc.push({ post: iteratedPost, score });
    return acc;
  }, []);

  postsWithScores.sort((a, b) => b.score - a.score);

  const selectedPosts: Post[] = [];
  let i = 0;
  while (selectedPosts.length < maxResults && i < postsWithScores.length) {
    selectedPosts.push(postsWithScores[i].post);
    i++;
  }

  return selectedPosts;
}
