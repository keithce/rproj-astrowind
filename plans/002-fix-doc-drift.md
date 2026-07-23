# Plan 002: Fix agent-facing documentation drift and add .env.example

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 43a2df2..HEAD -- CLAUDE.md README.md docs/claude/architecture.md docs/environment-setup.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `43a2df2`, 2026-07-19

## Why this matters

The repo's agent-facing docs are actively wrong in three places: they say the site runs Astro 5 when `package.json` pins `astro: 6.1.5` (upgraded in commit `7c07398`), they point to a content-config path that does not exist, and they omit the env vars the contact form (the site's only lead-capture path) needs to run. Agents executing the other plans in this directory read `CLAUDE.md` first — wrong docs mean wrong API assumptions and wasted runs. There is also no `.env.example`, so required configuration must be reverse-engineered from three partial sources.

## Current state

All of these were verified against the working tree at commit `43a2df2`:

- `CLAUDE.md` line 3: `Astro 5 creative studio website deployed on Vercel.` — actual version in `package.json` is `"astro": "6.1.5"`.
- `CLAUDE.md` "Required Environment" section lists only `NOTION_TOKEN`, `NOTION_RR_RESOURCES_ID`, and `PUBLIC_CLOUDINARY_CLOUD_NAME`. But `src/actions/index.ts:14` reads `import.meta.env.RESEND_API_KEY` and `src/actions/index.ts:82` reads `import.meta.env.NOTION_DATABASE_ID` — both required for the contact form; neither is documented.
- `README.md` line 67 (tech-stack table): `| **Framework**       | Astro 5, React 19 (interactive islands)           |`
- `docs/claude/architecture.md` line 7: `Four collections defined in ``src/content/config.ts``:` — that file does not exist; the real file is `src/content.config.ts` (repo root `src/`, note the dot, not a slash).
- `docs/environment-setup.md` — contains zero mentions of Resend or `RESEND_API_KEY` (verified via `grep -in 'resend' docs/environment-setup.md` → no matches). It documents only Cloudinary and Notion vars.
- No `.env.example` exists (`ls .env.example` → not found). A live `.env` exists locally but is gitignored — **never read, copy, or quote `.env` contents**.
- CI (`.github/workflows/actions.yaml:24-28`) additionally passes `CLOUDINARY_API_SECRET` and `CLOUDINARY_API_KEY` to the build.

## Commands you will need

| Purpose                         | Command                                                      | Expected on success      |
| ------------------------------- | ------------------------------------------------------------ | ------------------------ |
| Find remaining wrong versions   | `grep -rn "Astro 5" CLAUDE.md README.md docs/`               | no matches (after fix)   |
| Find wrong config path          | `grep -rn "src/content/config.ts" docs/ CLAUDE.md README.md` | no matches (after fix)   |
| Enumerate env vars used by code | Run the shell block below                                    | sorted list of var names |
| Format check                    | `bun run format`                                             | exit 0                   |

```sh
grep -rhoE "(import\.meta\.env|process\.env)\.[A-Z_]+" src scripts vendor \
  --include='*.ts' --include='*.tsx' --include='*.astro' \
  | grep -oE "[A-Z_]+$" \
  | sort -u
```

## Scope

**In scope** (the only files you should modify/create):

- `CLAUDE.md`
- `README.md`
- `docs/claude/architecture.md`
- `docs/environment-setup.md`
- `.env.example` (create)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):

- `.env` — never open it, never copy values from it. The `.env.example` you write contains key names and placeholder comments ONLY.
- The other ~15 files in `docs/` (stale one-off reports are a separately tracked backlog item, DOCS-04).
- Any source code.

## Git workflow

- Branch: `advisor/002-fix-doc-drift`
- Commit style: short imperative subject (e.g. "Fix Astro version references and document contact-form env vars").
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the Astro version references

In `CLAUDE.md` line 3 and `README.md` line 67, change "Astro 5" to "Astro 6". Then sweep for any other occurrence.

**Verify**: `grep -rn "Astro 5" CLAUDE.md README.md docs/` → no matches.

### Step 2: Fix the content-config path in architecture.md

In `docs/claude/architecture.md` line 7, change `src/content/config.ts` to `src/content.config.ts`. Sweep the rest of the docs for the same wrong path.

**Verify**: `grep -rn "src/content/config.ts" docs/ CLAUDE.md README.md` → no matches, and `ls src/content.config.ts` → exists.

### Step 3: Document the contact-form env vars

- In `CLAUDE.md`, extend the "Required Environment" list with:
  - `NOTION_DATABASE_ID` — Notion database receiving contact-form leads (`src/actions/index.ts`)
  - `RESEND_API_KEY` — Resend key for the contact-form welcome email (`src/actions/index.ts`)
- In `docs/environment-setup.md`, add a short "Resend (contact form)" section: which key is needed, that the contact form's email send fails without it, and that `NOTION_DATABASE_ID` is distinct from `NOTION_RR_RESOURCES_ID` (leads database vs. resources database).

**Verify**: `grep -c "RESEND_API_KEY" CLAUDE.md docs/environment-setup.md` → at least 1 in each file.

### Step 4: Create `.env.example`

Run the env-var enumeration command from "Commands you will need". Write `.env.example` with one line per variable actually referenced in `src/`, `scripts/`, or `vendor/`, each with an empty value and a one-line comment stating what it's for and whether it's required or optional. Known-required from code and CI: `NOTION_TOKEN`, `NOTION_RR_RESOURCES_ID`, `NOTION_DATABASE_ID`, `PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`. Include debug toggles you find (e.g. `DEBUG_NOTION_LOADER`, `NOTION_TRACE`, `NOTION_SANITIZER_MODE`) marked optional. Do NOT copy anything from `.env`. Placeholder values only (empty or `your-key-here`).

Then point both `CLAUDE.md` and `docs/environment-setup.md` at `.env.example` as the authoritative variable list.

**Verify**: `test -f .env.example` → exit 0; the following comparison → no output (the code and example sets match exactly); `grep -E "=(.+[A-Za-z0-9]{10,})" .env.example` → no matches (no real-looking values).

```sh
comm -3 \
  <(grep -rhoE "(import\.meta\.env|process\.env)\.[A-Z_]+" src scripts vendor \
    --include='*.ts' --include='*.tsx' --include='*.astro' \
    | grep -oE "[A-Z_]+$" | sort -u) \
  <(sed -nE 's/^([A-Z_][A-Z0-9_]*)=.*/\1/p' .env.example | sort -u)
```

### Step 5: Format check

**Verify**: `bun run format` → exit 0 (prettier check passes; if it flags the edited files, run `bun run format:fix` and re-check).

## Test plan

Docs-only change; the greps in each step are the tests. No unit tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "Astro 5" CLAUDE.md README.md docs/` → no matches
- [ ] `grep -rn "src/content/config.ts" docs/ CLAUDE.md README.md` → no matches
- [ ] `RESEND_API_KEY` and `NOTION_DATABASE_ID` documented in both `CLAUDE.md` and `docs/environment-setup.md`
- [ ] `.env.example` exists, its key set exactly matches the code enumeration, and it contains no real secret-looking values
- [ ] `git status` shows only in-scope files modified/created
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpted lines are not where "Current state" says (docs already fixed or moved).
- The env-var enumeration surfaces a variable whose purpose you cannot determine from the code that reads it — list it as `# TODO: purpose unknown` and flag it in your report instead of guessing.
- Anything requires opening `.env`.

## Maintenance notes

- When dependencies are upgraded (see plan 005), whoever bumps Astro major versions must update these same strings — consider a future check that greps docs for the major version.
- Reviewer should scrutinize `.env.example` for accidentally-real values before merge (should be placeholders only).
- Deferred: archiving the stale one-off reports in `docs/` (DOCS-04 in `plans/README.md`).
