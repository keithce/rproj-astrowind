import type { APIRoute } from 'astro';
// import { checkBotId } from 'botid/server';
import { redirectResponse } from '../../utils/api-responses';

export const POST: APIRoute = async ({ request }) => {
  // const verification = await checkBotId();

  // if (verification.isBot) {
  //   return jsonResponse(ApiErrors.botDetected(), 403);
  // }

  const redirectUrl = new URL('/thank-you', request.url);
  return redirectResponse(redirectUrl.toString());
};
