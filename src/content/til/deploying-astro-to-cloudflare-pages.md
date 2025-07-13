---
title: 'Deploying Astro to Cloudflare Pages'
date: 2025-06-15
tags: ['astro', 'cloudflare', 'deployment', 'web development']
description: 'Today I learned how to deploy an Astro site to Cloudflare Pages, including setting up adapter options for optimal performance.'
draft: false
---

# Deploying Astro to Cloudflare Pages

Today I went through the process of deploying an Astro site to Cloudflare Pages and learned some valuable tips for optimizing the deployment.

## 1. Install the Cloudflare Adapter

First, I needed to add the Cloudflare adapter:

```bash
npm add -D @astrojs/cloudflare
```

## 2. Update the Astro Configuration

Then I updated the `astro.config.mjs` file:

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // Cloudflare specific options
    mode: 'directory', // 'directory' is the recommended mode
    functionPerRoute: true, // Creates smaller, route-specific functions
  }),
});
```

## 3. Set Up Environment Variables

I discovered that Cloudflare Pages handles environment variables differently:

- Production variables are set in the Cloudflare Dashboard
- For local development, I used a `.dev.vars` file (similar to `.env` but specific to Cloudflare)

```
# .dev.vars
API_KEY=my_secret_key
DATABASE_URL=https://example.com/db
```

## 4. Adjust for Cloudflare Workers Limitations

One important limitation I encountered is that Cloudflare Workers (which power Pages Functions) have a maximum size limit of 1MB per Worker. To work around this:

1. Enable `functionPerRoute` to split code into smaller chunks
2. Optimize image handling by using Cloudflare's Image Resizing service instead of Astro's built-in image optimization
3. Be mindful of large dependencies that could push you over the limit

## 5. Deployment Process

The actual deployment process was straightforward:

```bash
# Install Cloudflare Wrangler CLI
npm install -g wrangler

# Preview locally
npx wrangler pages dev ./dist

# Deploy (via GitHub integration or direct upload)
```

## 6. Performance Optimizations

I learned some Cloudflare-specific optimizations:

- Enable Cloudflare's Auto Minify for HTML, CSS, and JS in the dashboard
- Use Cloudflare Images for responsive image handling
- Configure caching headers appropriately for static assets

## Conclusion

The most valuable insight was understanding how Astro's server-side rendering works with Cloudflare's edge functions. By configuring the adapter correctly and optimizing asset handling, I was able to deploy a fast, globally distributed Astro site that leverages Cloudflare's edge network.
