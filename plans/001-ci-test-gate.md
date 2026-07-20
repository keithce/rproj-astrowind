# Plan 001: Make CI run the test suites on every PR

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 43a2df2..HEAD -- .github/workflows/actions.yaml playwright.config.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `43a2df2`, 2026-07-19

## Why this matters

CI currently gates PRs only on `bun run check` (astro check + lint + format) and `bun run build`. No workflow ever runs `bun run test:unit` or `bun run test:e2e`, even though two good-quality Playwright specs exist in `tests/`. A PR can break the contact form, search, or navigation and still merge green. Every other plan in `plans/` relies on tests as its verification gate, so this is the baseline that must land first.

## Current state

- `.github/workflows/actions.yaml` — the only build/lint workflow. Excerpt (lines 11–29):

  ```yaml
  jobs:
    build-and-lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v6
        - uses: actions/setup-node@v6
          with:
            node-version: 22
        - uses: oven-sh/setup-bun@v2
        - run: bun install --frozen-lockfile
        - run: bun run check
        - run: bun run build
          env:
            NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
            NOTION_RR_RESOURCES_ID: ${{ secrets.NOTION_RR_RESOURCES_ID }}
            CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
            CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
            PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.PUBLIC_CLOUDINARY_CLOUD_NAME }}
          if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false)
  ```

  There is also a `codeql` job in the same file — leave it untouched.

- `playwright.config.ts` — already CI-aware: `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? 1 : undefined`, and a `webServer` block that runs `bun run dev` on port 4321 with `reuseExistingServer: !process.env.CI`. Playwright starts the dev server itself; the CI job does NOT need to start a server.

- `package.json` scripts (relevant):
  - `"test:unit": "bun test --pass-with-no-tests \"src/**/*.test.ts\" \"src/**/*.test.tsx\" \"tests/unit/**/*.test.ts\" \"tests/unit/**/*.test.tsx\""` — currently passes trivially (zero unit tests exist; plan 003 adds them).
  - `"test:e2e": "bunx playwright test"`
  - `"dev": "export DEBUG_NOTION_LOADER=1 && mkdir -p public && bun run pagefind:sync && astro dev"` — this is what Playwright's webServer runs. In dev mode the content config uses a cached/fallback resources loader instead of the live Notion loader, so the dev server does not strictly require Notion secrets — but pass the same secrets as the build step anyway so behavior matches local runs.

- Existing specs: `tests/core-journeys-static-search.spec.ts` and `tests/view-transitions-head-persistence.spec.ts`. Chromium-only project (a deliberate CI speed choice per the comment in `playwright.config.ts`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `bun install --frozen-lockfile` | exit 0 |
| Install browsers | `bunx playwright install --with-deps chromium` | exit 0 |
| Unit tests | `bun run test:unit` | exit 0 (passes with no tests today) |
| E2E tests | `bun run test:e2e` | exit 0, both specs pass |
| YAML sanity | `bunx yaml-lint .github/workflows/actions.yaml` or `node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/actions.yaml','utf8')); console.log('ok')"` | `ok` (js-yaml is already a devDependency) |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/actions.yaml`

**Out of scope** (do NOT touch, even though they look related):
- `playwright.config.ts` — already CI-ready; a build/preview-based E2E variant is a separately tracked backlog item (TEST-03 in `plans/README.md`).
- `.github/workflows/accessibility-testing.yml`, `css-validation.yml`, `opencode.yml` — separate pipelines.
- The two existing spec files — do not "fix" or extend them here.

## Git workflow

- Branch: `advisor/001-ci-test-gate`
- Commit style: short imperative subject, matching repo history (e.g. "Add opencode workflow and pad category cards").
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a `test` job to `.github/workflows/actions.yaml`

Append a new job alongside `build-and-lint` (same file, same triggers). Target shape:

```yaml
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 22
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run test:unit
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:e2e
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_RR_RESOURCES_ID: ${{ secrets.NOTION_RR_RESOURCES_ID }}
          CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
          CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
          PUBLIC_CLOUDINARY_CLOUD_NAME: ${{ secrets.PUBLIC_CLOUDINARY_CLOUD_NAME }}
        if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false)
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

Notes:
- Keep the same fork-PR guard (`if:` condition) as the build step — fork PRs have no secrets.
- The action versions must match the ones already used in this file (`actions/checkout@v6`, `actions/setup-node@v6`, `oven-sh/setup-bun@v2`). Use `actions/upload-artifact@v4` (not present in the file yet; v4 is current).

**Verify**: the js-yaml one-liner from "Commands you will need" → prints `ok`.

### Step 2: Prove the job's commands work locally

Run, in order: `bun install --frozen-lockfile`, `bun run test:unit`, `bunx playwright install --with-deps chromium` (on macOS `--with-deps` may be a no-op; that's fine), `CI=1 bun run test:e2e`.

**Verify**: `CI=1 bun run test:e2e` → exit 0, output shows both spec files ran and passed. If a test fails locally on an unmodified working tree, that is a STOP condition (pre-existing breakage to report, not to fix here).

## Test plan

No new tests are written in this plan — it wires existing suites into CI. The verification is Step 2's local run.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git diff --name-only` shows only `.github/workflows/actions.yaml` modified
- [ ] `grep -c "test:e2e" .github/workflows/actions.yaml` → `1`
- [ ] `grep -c "test:unit" .github/workflows/actions.yaml` → `1`
- [ ] js-yaml parse one-liner → `ok`
- [ ] `CI=1 bun run test:e2e` → exit 0 locally
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The existing Playwright specs fail on an unmodified checkout (pre-existing breakage — report which spec and the error).
- `.github/workflows/actions.yaml` no longer contains the `build-and-lint` job shown in "Current state" (drift).
- The dev server started by Playwright's `webServer` fails to boot without additional env vars — report which var it demanded rather than inventing values.

## Maintenance notes

- Plan 003 adds the first real unit tests; once it lands, `test:unit` stops being a trivial pass — nothing in this job needs to change.
- Backlog item TEST-03 (run E2E against `astro build && astro preview` instead of the dev server) builds directly on this job; whoever picks it up should add a second job or matrix entry, not replace this one.
- Reviewer should scrutinize: the fork-PR `if:` guard is present on the E2E step, so fork PRs still run unit tests but skip the secret-requiring E2E step.
