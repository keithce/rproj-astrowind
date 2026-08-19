import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';
import { config } from 'dotenv';

// Load environment variables explicitly
config();

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import react from '@astrojs/react';

import astrowind from './vendor/integration';
import vercelServerless from '@astrojs/vercel';
import pagefind from './src/utils/pagefind';

import { lazyImagesRehypePlugin, readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'server',
  adapter: vercelServerless({
    webAnalytics: {
      enabled: true,
    },
    maxDuration: 30,
    isr: {
      // Writing and blog pages fetch Frequency exports at request time.
      // One hour is fresher than the previous 8-hour full production rebuild,
      // without spending build minutes.
      expiration: 60 * 60,
      ...(process.env.ISR_BYPASS_TOKEN ? { bypassToken: process.env.ISR_BYPASS_TOKEN } : {}),
      exclude: ['/til/board', '/api/revalidate', /^\/api\/.+/],
    },
  }),

  build: {
    format: 'file',
  },

  integrations: [
    react(),
    pagefind(),
    sitemap(),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),
    partytown({
      config: { forward: ['dataLayer.push'] },
    }),
    compress({
      // Vite already minifies CSS. A second pass (csso) silently drops Tailwind
      // v4 range media queries like `@media (width >= 40rem)`, so desktop
      // renders the mobile-first layout.
      CSS: false,
      // Vercel already brotli/gzip's HTML at the edge. Minifying 1,300+ HTML
      // files here was taking ~2 of every 4-minute production build.
      HTML: false,
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),
    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com', 'images.unsplash.com', 'images.pexels.com', 'res.cloudinary.com'],
    responsiveStyles: true,
    layout: 'constrained',
    // Several posts/heroes use local SVG assets that `adaptOpenGraphImages` rasterizes to JPEG
    // for Open Graph tags. Astro >=6.3 refuses to process SVG sources unless this is opted in.
    dangerouslyProcessSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
        '@src': path.resolve(__dirname, './src'),
      },
    },
  },
} as const);
