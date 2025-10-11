Ran tool

Ran tool

When you look at the **Vercel log** you can see two different requests:

```
POST /api/submit-to-notion   — 200   “Welcome e-mail sent …”
GET  /api/submit-to-notion   — 404   “No API Route handler exists …”
```

That first line should have been **303** with a `Location` header, but the
runtime reports **200**.  
When the browser receives 200 it stays on the same URL; after a form POST it
then reloads the page with **GET**, which explains the 404.

So the redirect never makes it out of the function.  
This means something after your `return` is still touching the response object
and resets the status (that is what triggers Undici’s “immutable”/“Headers.set”
error you saw before).

# What to check / how to debug

1 . Confirm what the function is really sending  
 Use curl or the browser’s DevTools:

```bash
curl -i -X POST -d "name=X&email=x@y.z&service=Design&message=Hi" \
     https://<your-app>.vercel.app/api/submit-to-notion
```

You should see

```
HTTP/1.1 303 See Other
location: https://<your-app>.vercel.app/thank-you
```

If you get `200 OK` here, the redirect header is being stripped.

2 . Check Astro / Vercel middle-ware  
 The stack-trace points into `astro-designed-error-pages_*.mjs` – Astro adds a
wrapper that injects the nice HTML error pages.  
 That wrapper runs **after** your code; if it thinks the response’s status code
is “error-like” it overwrites the body and status.

A redirect status is fine, but only if Astro can still read the headers. If the
**Headers object is frozen** Astro can’t append its own headers and throws; then
it falls back to 200.

‣ Creating the response with **new Headers(…)** keeps it mutable  
 ‣ Don’t call `Response.redirect()` – that produces an immutable header set

You already switched to `new Response(null, { … })`, which is correct, but make
sure it is the last thing returned in _all_ code paths (no further `await xyz;`
after the return).

3 . Remove or move BotID middleware (quick test)  
 Temporarily comment out the import / use of `botid/server` and
`<BotIdClient …>` to make sure that library is not replacing the response.

4 . Log the response just before returning

```ts
console.log('returning', 303, redirectUrl.toString());
return new Response(null, {
  status: 303,
  headers: new Headers({ location: redirectUrl.toString() }), // lower-case also
});
```

Look for that line in Vercel’s “Functions → Logs”.  
 If you see the log but the runtime still prints “200 OK”, something in the
middleware chain mutates it – you can then disable middlewares one by one
(`astro-designed-error-pages`, custom session middleware, etc.) to find the
culprit.

5 . As a last resort, bypass Astro’s middleware completely: return a tiny HTML
page that redirects with meta-refresh or JS. If that works the bug is definitely
in the middleware stage, not in the function itself.

## Summary of the safe redirect pattern

```ts
const redirectUrl = new URL('/thank-you', request.url);

return new Response(null, {
  status: 303, // or 302
  headers: new Headers({
    location: redirectUrl.toString(), // lower-case key is fine
    'cache-control': 'no-store',
  }),
});
```

Make sure **nothing else runs after this return** and that no other middleware
tries to rewrite the response to add error pages.
