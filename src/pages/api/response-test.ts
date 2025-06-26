import type { APIRoute } from 'astro';
import { checkBotId } from 'botid/server';

export const POST: APIRoute = async ({ request }) => {
  const verification = await checkBotId();

  if (verification.isBot) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }

  const redirectUrl = new URL('/thank-you', request.url);
  return new Response(null, {
    status: 303,
    headers: new Headers({
      location: redirectUrl.toString(),
    }),
  });
};
