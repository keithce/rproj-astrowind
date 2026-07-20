# Plan 003: Test the contact action, fix its silently-swallowed email failures and duplicate-lead retry path

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 43a2df2..HEAD -- src/actions/ src/utils/notion-datasource.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (refactors the only lead-capture path; mitigated by characterization tests written first)
- **Depends on**: plans/001-ci-test-gate.md (so the new tests actually gate PRs)
- **Category**: bug + tests
- **Planned at**: commit `43a2df2`, 2026-07-19

## Why this matters

The `contact` action in `src/actions/index.ts` is the site's only lead-capture path: it validates a form, writes a lead to Notion, and sends a welcome email via Resend. It has zero tests, and it has two real defects:

1. **Email failures are silently reported as full success.** The repo uses `resend@6.10.0`. The Resend v6 SDK does **not throw** on API errors — `resend.emails.send()` resolves to `{ data, error }`. The action discards that return value (line 134), so a failed send falls through to the `success: true / "Form submitted successfully!"` return. The elaborate `isResendError` catch-branch (lines 184–219) is effectively dead code — it only fires for thrown network-level errors, not API rejections.
2. **Retries duplicate leads.** `notion.pages.create` (line 100) succeeds, then if anything later throws an unclassified error, the outer catch throws `INTERNAL_SERVER_ERROR` and the user is told "Please try again later" — a retry creates a second Notion lead row and potentially a second email. The Notion write should be the commit point: once the lead is captured, the action should not report failure.

The current code also can't be unit-tested: the handler is inlined into `defineAction` and the module imports the virtual modules `astro:actions`/`astro:schema`, which don't resolve under `bun test`. The fix is to extract the handler into a plain function with injected clients, write characterization tests, then change the behavior.

## Current state

- `src/actions/index.ts` — the whole action (236 lines). Key excerpts as of `43a2df2`:

  Module-level clients (lines 14–18):
  ```ts
  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const notion = new Client({
    auth: import.meta.env.NOTION_TOKEN,
    notionVersion: '2025-09-03',
  });
  ```

  The send whose result is discarded (lines 132–139):
  ```ts
  const html = await render(React.createElement(ResonantWelcomeEmail, { steps }));

  await resend.emails.send({
    from: 'info@rproj.art',
    to: email,
    subject: 'Welcome to Resonant Projects.art!',
    html,
  });
  ```

  The partial-success branch that is currently unreachable for API errors (lines 207–219):
  ```ts
  if (isResendError(error)) {
    // ...
    return {
      success: true,
      message: 'Form submitted! Confirmation email may be delayed.',
      redirect: '/thank-you',
    };
  }
  ```

  Other facts: Zod schema at lines 58–65 (name ≤100, email, service enum `['Design','Rhythm','Color','Motion']`, message ≤5000); prohibited-words check at lines 70–78 throws `ActionError BAD_REQUEST`; `resolveDataSourceId(notion, databaseId)` at line 90 (from `src/utils/notion-datasource.ts`) maps a Notion `database_id` to a `data_source_id`; `console.debug('[action:contact] Processing form submission for:', name)` at line 67 logs submitter PII.

- `src/utils/notion-datasource.ts` — exports `resolveDataSourceId(client, databaseId)`; module-level Map cache. Read it before Step 1; the extracted handler keeps calling it unchanged.
- `src/components/widgets/ContactFormReact.tsx` — the React island consuming this action via `useActionState`. It depends on the `ContactFormState` shape (`success`, `message`, `redirect?`, `errors?`). **The returned shape must not change.**
- Unit-test infrastructure: `package.json` has `"test:unit": "bun test --pass-with-no-tests \"src/**/*.test.ts\" ... \"tests/unit/**/*.test.ts\" ..."`. `tests/unit/` does not exist yet — create it. There are no existing unit tests to copy style from; use `bun:test` (`describe`/`it`/`expect`/`mock`) directly.
- Convention: all imports use the `~` alias (e.g. `~/utils/welcome-email`). Match it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Unit tests | `bun run test:unit` | exit 0, new tests pass |
| Typecheck | `bun run typecheck` | exit 0 |
| Astro check | `bun run check:astro` | exit 0 |
| Lint | `bun run lint` | exit 0 |
| Full build | `bun run build` | exit 0 |

## Scope

**In scope** (the only files you should modify/create):
- `src/actions/index.ts` (slim down to a thin wrapper)
- `src/actions/contact-handler.ts` (create — extracted logic)
- `tests/unit/contact-handler.test.ts` (create)

**Out of scope** (do NOT touch):
- `src/components/widgets/ContactFormReact.tsx` and `NotionContact.astro` — the client contract (`ContactFormState`) must remain identical, so no client change is needed.
- `src/utils/notion-datasource.ts` — used as-is (its duplication with the vendored loader is backlog item DEBT-02).
- `src/utils/welcome-email.tsx` — email template unchanged.
- Bot protection / rate limiting — that is plan 004; do not add it here.

## Git workflow

- Branch: `advisor/003-contact-action-tests-and-fixes`
- Commit per step; short imperative subjects.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract the handler into `src/actions/contact-handler.ts`

Create a plain, dependency-injected function containing everything currently inside `handler:` — prohibited-words check, data-source resolution, Notion page create, email render + send, and error classification. No imports from `astro:actions`/`astro:schema` in this file.

Target shape (signature is load-bearing; body comes from moving the existing code):

```ts
import type { Client } from '@notionhq/client';
import type { Resend } from 'resend';

export interface ContactInput {
  name: string;
  email: string;
  service: string;
  message: string;
}

export type ContactResult =
  | { kind: 'success'; emailSent: boolean }
  | { kind: 'rejected'; reason: 'prohibited_content' }
  | { kind: 'config_error'; detail: string }
  | { kind: 'service_error'; detail: string };

export interface ContactDeps {
  notion: Client;
  resend: Resend;
  databaseId: string | undefined;
  renderWelcomeEmail: (name: string, service: string) => Promise<string>;
}

export async function processContactSubmission(deps: ContactDeps, input: ContactInput): Promise<ContactResult>;
```

Semantics to implement in this step (characterized in Step 2, behavior-fixed in Step 3):
- prohibited word → `{ kind: 'rejected', reason: 'prohibited_content' }`
- missing `databaseId` → `{ kind: 'config_error', ... }`
- Notion failure (reuse the existing `isNotionError` classification, moved here) → `{ kind: 'service_error', ... }`
- For this step only, keep the current (buggy) email behavior: `await deps.resend.emails.send(...)` with the result discarded, `emailSent: true` unconditionally on reaching the send. Preserving current behavior first is deliberate — Step 2's tests characterize it.

Also in this step: move the welcome-email `steps` array + `render(React.createElement(...))` into a small exported `renderWelcomeEmail(name, service)` helper (it can live in `contact-handler.ts`), and drop the submitter `name` from the `console.debug` line when moving it (log `'[action:contact] Processing form submission'` — no PII).

Then rewrite `src/actions/index.ts` as a thin wrapper: keep the Zod `input` schema, `ALLOWED_SERVICES`, module-level `resend`/`notion` clients, and the exported `ContactFormState` interface exactly as they are; the `handler` becomes:
- call `processContactSubmission({ notion, resend, databaseId: import.meta.env.NOTION_DATABASE_ID, renderWelcomeEmail }, input)`
- map results: `rejected` → throw `ActionError BAD_REQUEST` with the existing user-facing message; `config_error`/`service_error` → throw `ActionError INTERNAL_SERVER_ERROR` with the existing messages; `success` → the existing `{ success: true, message, redirect: '/thank-you' }` (message per Step 3).

**Verify**: `bun run typecheck` → exit 0; `bun run check:astro` → exit 0.

### Step 2: Write characterization tests in `tests/unit/contact-handler.test.ts`

Use `bun:test`. Build tiny fakes — objects with just the methods the handler calls (`notion.pages.create`, `notion.databases.retrieve` if `resolveDataSourceId` needs it — simpler: pass a `databaseId` and have the fake `databases.retrieve` return `{ data_sources: [{ id: 'ds_1' }] }`), `resend.emails.send`, and a stub `renderWelcomeEmail` resolving to `'<html></html>'`. Cast fakes with `as unknown as Client` / `as unknown as Resend`.

Cases (each is one `it`):
1. Happy path: valid input → `{ kind: 'success' }`; `notion.pages.create` called once with the four properties; `resend.emails.send` called once with `to: input.email`.
2. Prohibited word in message → `{ kind: 'rejected' }`; neither client called.
3. Missing databaseId → `{ kind: 'config_error' }`; no Notion write.
4. Notion create rejects with `{ code: 'rate_limited' }` → `{ kind: 'service_error' }`; `resend.emails.send` NOT called.
5. **The bug, characterized**: `resend.emails.send` resolves `{ data: null, error: { name: 'application_error', message: 'boom' } }` → currently returns `{ kind: 'success', emailSent: true }`. Write the assertion for the CURRENT behavior with a comment `// BUG: flipped in Step 3`.
6. **The retry-duplication path, characterized**: `resend.emails.send` REJECTS (throws) after Notion create succeeded → assert current behavior (whatever the moved code does — if the thrown error has `statusCode`, current `isResendError` returns partial success; if it's a bare `Error`, current code surfaces `service_error`). Comment `// BUG: flipped in Step 3`.

**Verify**: `bun run test:unit` → exit 0, 6 tests pass.

### Step 3: Fix the two behaviors, flipping the characterization tests

In `contact-handler.ts`:

1. Check the send result: `const { error } = await deps.resend.emails.send(...); const emailSent = !error;` — on error, log a warn with the error's `name`/`message` (no user content) and return `{ kind: 'success', emailSent: false }`.
2. Make the Notion write the commit point: wrap everything AFTER a successful `notion.pages.create` (email render + send) in its own try/catch that can only produce `{ kind: 'success', emailSent: false }` — never a thrown error or `service_error`. Delete the now-dead `isResendError` helper.

In `src/actions/index.ts`, map `emailSent`: `true` → `'Form submitted successfully!'`; `false` → `'Form submitted! Confirmation email may be delayed.'` (both messages already exist in the file).

Update tests 5 and 6 to assert the new behavior: both → `{ kind: 'success', emailSent: false }`. Add test 7: `renderWelcomeEmail` itself throws after Notion create succeeded → still `{ kind: 'success', emailSent: false }` (no duplicate-lead retry prompt).

**Verify**: `bun run test:unit` → exit 0, 7 tests pass; `grep -c "isResendError" src/actions/` → 0 matches.

### Step 4: Full verification

**Verify**: `bun run typecheck` → exit 0; `bun run lint` → exit 0; `bun run build` → exit 0.

## Test plan

Covered by Steps 2–3: 7 unit tests in `tests/unit/contact-handler.test.ts` (happy path, prohibited content, config error, Notion failure, Resend error-object, Resend throw, render throw). They run via `bun run test:unit`, which plan 001 wired into CI. No E2E form-submission test in this plan (would send real email/Notion writes; deferred — see Maintenance notes).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun run test:unit` → exit 0 with 7 passing tests in `tests/unit/contact-handler.test.ts`
- [ ] `bun run typecheck`, `bun run lint`, `bun run build` all exit 0
- [ ] `grep -n "emails.send" src/actions/contact-handler.ts` shows the result captured (destructured `error`), not a bare `await`
- [ ] `grep -rn "isResendError" src/` → no matches
- [ ] `grep -n "Processing form submission" src/actions/contact-handler.ts` shows no `name` argument in the log
- [ ] `ContactFormState` interface in `src/actions/index.ts` unchanged (`git diff` shows no edit to its fields)
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/actions/index.ts` no longer matches the "Current state" excerpts (drift since `43a2df2`).
- `resend.emails.send` in the installed `resend@6.10.0` does NOT return `{ data, error }` — check `node_modules/resend/dist` types in Step 3; if it throws on API errors instead, the premise of fix #1 is wrong: report instead of improvising.
- `bun test` cannot import `@notionhq/client` or `resend` types for the fakes.
- The refactor appears to require changing `ContactFormReact.tsx` — the state shape was supposed to be preserved; something is off.

## Maintenance notes

- Plan 004 (bot protection) adds a check at the TOP of this same handler/wrapper — it depends on this plan's extracted structure. Land this first.
- Deferred: a Playwright E2E of the real form submission needs a mail/Notion sandbox strategy (env-gated fakes or a test inbox); tracked as backlog TEST-02-e2e in `plans/README.md`.
- Reviewer should scrutinize: the commit-point semantics — after a successful Notion write, no path may surface an error to the user (that's what prevents duplicate leads); and that no log line contains submitter name/email/message content.
