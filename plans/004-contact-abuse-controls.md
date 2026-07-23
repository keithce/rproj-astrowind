# Plan 004: Put bot protection in front of the contact action

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 43a2df2..HEAD -- src/actions/ src/layouts/Layout.astro src/components/widgets/ContactFormReact.tsx vercel.json astro.config.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. Note: plan 003 intentionally
> restructures `src/actions/` — that is expected drift; read the
> post-003 code and `plans/003-contact-action-tests-and-fixes.md` first.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (a misconfigured bot check can block real leads — the exact people the site exists to capture)
- **Depends on**: plans/003-contact-action-tests-and-fixes.md
- **Category**: security
- **Planned at**: commit `43a2df2`, 2026-07-19

## Why this matters

The contact action is an unauthenticated endpoint that, on every POST, creates a Notion page and sends an email **to a submitter-controlled address** (`to: email`). There is no bot check, no rate limit, and the only content gate is a three-word denylist (`['spam', 'test123', 'dummy']`). Anyone can script it to (a) email arbitrary third parties from the site's verified sender — burning the Resend domain reputation, (b) flood the Notion leads database, and (c) run up serverless/email costs. The `botid` package (Vercel BotID) is already installed (`botid: ^1.5.11`) and `vercel.json` already contains its challenge/proxy rewrites — the client component was simply commented out and the server-side check never written.

## Current state

- `src/layouts/Layout.astro` — the sitewide layout. The BotID client is commented out:
  - line 13: `// import { BotIdClient } from 'botid/client';`
  - line 38: `<!-- <BotIdClient protect={protectedRoutes} /> -->`
  - No `protectedRoutes` variable exists in the file — it must be defined.
- `vercel.json` lines 34–43 — the BotID proxy rewrites are ALREADY present (the `/149e9513-.../...` sources routing to `https://api.vercel.com/bot-protection/v1/challenge` and `.../proxy/:path*`), plus an `X-Frame-Options: SAMEORIGIN` header on that path. Do not modify these.
- `src/actions/index.ts` + `src/actions/contact-handler.ts` (post plan 003) — thin `defineAction` wrapper delegating to `processContactSubmission`. Pre-003 the whole handler is inline in `index.ts`; either way the bot check goes in the `defineAction` handler (the wrapper), not in the pure `contact-handler.ts` (keep it unit-testable without request context).
- `src/components/widgets/ContactFormReact.tsx` — React island submitting via `useActionState`. Astro actions POST to a URL of the form `/_actions/contact`.
- `package.json` — `"botid": "^1.5.11"` in `dependencies`. Note for reference reading: the BotID docs/README ship inside `node_modules/botid/`.
- The three-word denylist (moved into `contact-handler.ts` by plan 003) stays — it's harmless — but must not be treated as a real control.

## Commands you will need

| Purpose                   | Command               | Expected on success                  |
| ------------------------- | --------------------- | ------------------------------------ |
| Typecheck                 | `bun run typecheck`   | exit 0                               |
| Astro check               | `bun run check:astro` | exit 0                               |
| Unit tests                | `bun run test:unit`   | exit 0 (plan 003's tests still pass) |
| Build                     | `bun run build`       | exit 0                               |
| Dev server (manual check) | `bun run dev`         | serves on :4321                      |

## Suggested executor toolkit

- Read `node_modules/botid/README.md` (and its `client`/`server` type declarations) BEFORE Step 1 — the exact API (`BotIdClient` props, `checkBotId()` signature and return shape) must come from the installed version, not from memory.
- If a docs-lookup tool (e.g. Context7) is available, consult the current Vercel BotID docs for the Astro/framework-agnostic integration path.

## Scope

**In scope** (the only files you should modify):

- `src/layouts/Layout.astro` (re-enable the client component)
- `src/actions/index.ts` (server-side check in the action wrapper)
- `src/actions/contact-bot-guard.ts` (create — dependency-injected wrapper guard)
- `tests/unit/contact-bot-guard.test.ts` (create — mocked allowed and blocked BotID verdicts)
- `astro.config.ts` (ONLY if the installed botid version requires a build plugin per its README)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):

- `vercel.json` — the BotID rewrites are already correct.
- `src/actions/contact-handler.ts` — keep the pure handler free of request-context dependencies.
- Redis-based rate limiting — a `REDIS_URL` exists in the local env but its provider/purpose is unverified; per-IP rate limiting is deferred to backlog item SEC-01b rather than guessed at here.
- The denylist word list — leave as-is.

## Git workflow

- Branch: `advisor/004-contact-abuse-controls`
- Commit per step; short imperative subjects.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Re-enable the BotID client in `src/layouts/Layout.astro`

Uncomment the import (line 13) and the head component (line 38), and define the routes to protect in the frontmatter:

```ts
import { BotIdClient } from 'botid/client';

const protectedRoutes = [
  {
    path: '/_actions/contact',
    method: 'POST',
  },
];
```

Confirm the exact prop name (`protect`) and route-object shape against `node_modules/botid`'s type declarations; adjust to the installed API if it differs (that is an allowed adjustment, not improvisation — record what you changed).

**Verify**: `bun run check:astro` → exit 0; `bun run dev` then `curl -s http://localhost:4321/ | grep -ci "botid\|bot-protection"` → ≥ 1 (the client script/config is rendered into the page).

### Step 2: Add the server-side check to the action wrapper

In `src/actions/index.ts`, at the top of the `handler` (before calling `processContactSubmission`), verify the request with BotID's server helper (from `botid/server` — confirm the import path and signature against the installed package):

```ts
const verification = await checkBotId();
if (verification.isBot) {
  throw new ActionError({
    code: 'FORBIDDEN',
    message: 'Your submission could not be verified. Please try again.',
  });
}
```

Notes:

- Astro actions run inside an Astro request context on Vercel; if `checkBotId()` needs the request headers explicitly, pass them from the action's `context` (second handler argument in Astro actions — `handler: async (input, context)`).
- In local dev (no Vercel bot infrastructure), the check must fail OPEN, not closed: if the installed helper doesn't already treat local/dev as verified (the README will say — BotID is documented to allow local dev traffic), gate the check on `import.meta.env.PROD`.

**Verify**: `bun run typecheck` → exit 0; `bun run test:unit` → exit 0 (pure-handler tests unaffected); `bun run dev` and submit the contact form on `/contact` in a browser or via the page — submission still succeeds locally (fail-open confirmed).

Keep the verdict-to-error behavior testable without importing Astro virtual modules: extract a dependency-injected `guardContactSubmission(checkBotId, onAllowed)` into `src/actions/contact-bot-guard.ts`, have the action wrapper pass the real `checkBotId` and contact handler, and keep request-context concerns out of `contact-handler.ts`. In `tests/unit/contact-bot-guard.test.ts`, cover both verdicts: `{ isBot: false }` calls `onAllowed` once, while `{ isBot: true }` produces the exact `FORBIDDEN` code and user-facing message above without calling `onAllowed` or either external client.

### Step 3: Full verification

**Verify**: `bun run build` → exit 0; `bun run lint` → exit 0.

## Test plan

- The pure handler tests from plan 003 must still pass unchanged (`bun run test:unit`).
- The mocked wrapper-guard test must prove both allowed browser traffic and an `isBot: true` rejection before side effects.
- On the preview deployment, submit once through a normal browser (allowed) and once with a headless request using the actual action endpoint and payload observed in the browser (blocked with `FORBIDDEN`). Record both results in the PR; Vercel documents this browser-versus-headless check as its BotID deployment smoke test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "BotIdClient" src/layouts/Layout.astro` → uncommented import + usage (no `//` or `<!--` on those lines)
- [ ] `grep -n "checkBotId\|botid/server" src/actions/index.ts` → present
- [ ] `tests/unit/contact-bot-guard.test.ts` covers allowed and blocked verdicts, including exact `FORBIDDEN` output and zero side effects for the blocked path
- [ ] `bun run typecheck`, `bun run check:astro`, `bun run test:unit`, `bun run build` all exit 0
- [ ] Local dev form submission succeeds (fail-open verified)
- [ ] Preview smoke: normal browser submission succeeds; the headless request is rejected as `FORBIDDEN`
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The installed `botid` package exposes a materially different API than `BotIdClient` / `checkBotId` (e.g. requires a framework plugin this plan didn't anticipate, or has no server helper) — report the actual API surface.
- BotID requires a Vercel dashboard/deployment setting you cannot verify from the repo — implement the code side, then report that deployment activation is needed.
- The local dev form submission starts failing with the check in place (fail-closed in dev) and gating on `import.meta.env.PROD` doesn't resolve it.
- Protecting `/_actions/contact` turns out to be the wrong path shape for this Astro version's action endpoint (check the network tab during a dev submission for the real POST URL; if it differs, use the observed URL and record it).

## Maintenance notes

- **First production deploy after this lands needs a manual smoke test**: submit the real contact form once from a normal browser and confirm (a) the submission succeeds and (b) the lead appears in Notion. A false-positive bot verdict on real visitors is the main risk of this change and only observable in production.
- Deferred (backlog SEC-01b): per-IP rate limiting as a second layer — decide the store first (the local env's `REDIS_URL` provider is unverified; Upstash-compatible REST would allow `@upstash/ratelimit`).
- Deferred (backlog SEC-05): disposable-email-domain rejection.
- If the contact form is ever moved off Astro actions (e.g. to an API route), the `protectedRoutes` path in `Layout.astro` must move with it — they are coupled.
