---
name: write-e2e-test
description: 'Write or extend Playwright end-to-end tests for the wahlumfragen app. Use when asked to add an e2e test, cover a page/route or a user flow in the browser, or test navigation, rendering, or the SEO document contract. Knows this project''s convention: specs live in e2e/, run against the BUILT app (npm run start), are Desktop-Chrome-only, and are written DB-tolerant (assert structure that holds with or without data).'
---

# write-e2e-test

E2E tests are **Playwright**, in the **`e2e/` directory** as `*.spec.ts`. They run
against the **built, started** app, not the dev server. Config:
`playwright.config.ts` — `baseURL` (so use **relative paths**, `page.goto("/trend")`),
one project (`Desktop Chrome`), and a `webServer` that runs `npm run start`.

```bash
npm run build && npm run test:e2e      # start runs the built app; build first
npm run test:e2e:ui                    # interactive UI mode
npm run test:e2e -- e2e/home.spec.ts   # a single spec
# Against an already-running server (skips the built-in webServer):
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

The `webServer` command is `npm run start`, which serves `.next/` — so a **fresh
build is required** or you test stale output. (Set `E2E_BASE_URL` to point at a
server you started yourself, e.g. `npm run dev`.)

## The key convention: write DB-tolerant assertions

The suite is designed to **pass with or without poll data** — an empty DB renders
an empty UI (there's no live fallback), and the existing specs accept that rather
than requiring an ingest. So assert the **document structure, navigation, and SEO
contract** that holds regardless of data, and for data-dependent regions use the
**`list.or(empty)` pattern** instead of asserting rows exist:

```ts
const list = page.getByTestId("survey-list");
const empty = page.getByTestId("empty-state");
await expect(list.or(empty)).toBeVisible({ timeout: 15_000 });
```

If a test genuinely needs populated data, it must own that prerequisite (build
with a migrated, ingested DB — see `local-dev`/`ingest`) and say so; don't make
the default suite depend on data silently.

## House style (match the existing specs)

Read a sibling first — `e2e/home.spec.ts` for page structure,
`e2e/seo.spec.ts` for the document/SEO contract, `e2e/navigation.spec.ts` for
flows — and mirror it:

- `import { expect, test } from "@playwright/test";` then
  `test.describe("…", () => { test("…", async ({ page }) => { … }) })`.
- **Prefer role and test-id locators** over CSS. The app exposes stable
  `data-testid` hooks: `site-nav`, `site-footer`, `survey-list`, `empty-state`,
  `data-freshness` (and more — grep `data-testid` for the current set). Add a new
  `data-testid` to a component when you need a stable hook rather than coupling
  the test to markup/classes.
- Use `getByRole("heading", { … , level: 1 })`, `getByRole("link", { name })`,
  scoped queries (`footer.getByRole(...)`), and web-first `await expect(...)`
  assertions with auto-retry.
- **The SEO contract has a home**: the one-unique-`<h1>`-per-page +
  self-referencing-canonical checks live in `e2e/seo.spec.ts` (`PAGES` list). A
  **new indexable route** should be added to that list, not re-asserted ad hoc
  (see the `seo-audit` skill).
- The shared wordmark is a **link, not a heading** — assert pages' own `<h1>`,
  and the wordmark via `getByRole("link", { name: "Wahlumfragen" })`.

## What e2e is for vs. unit

E2E covers **rendering, routing, navigation, and the document/SEO contract in a
real browser** — things unit tests can't see. Keep **pure logic** (selectors,
transforms, formatting, seat/coalition math) in fast Vitest units
(`write-unit-test`); don't re-test computed values through the browser.

## Finishing

1. `npm run build && npm run test:e2e -- e2e/your.spec.ts` green; full e2e suite
   before declaring done.
2. Keep it deterministic — no `Math.random`, no real wall-clock dependence; rely
   on web-first assertions/timeouts, not `waitForTimeout`.
3. Commit with the `commit-push` skill, `test(e2e):` title (e.g.
   `test(e2e): cover the koalition page`).
