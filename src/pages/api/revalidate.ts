import type { APIRoute } from 'astro';

export const prerender = false;

const PATHS_TO_REVALIDATE = ['/writing', '/blog', '/rss.xml', '/'] as const;

export const POST: APIRoute = async ({ request }) => {
  const token = process.env.ISR_BYPASS_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: 'ISR_BYPASS_TOKEN is not configured' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${token}`) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = new URL(request.url).origin;
  const results = await Promise.all(
    PATHS_TO_REVALIDATE.map(async path => {
      const response = await fetch(new URL(path, origin), {
        headers: {
          'x-prerender-revalidate': token,
        },
      });
      return { path, status: response.status };
    })
  );

  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
