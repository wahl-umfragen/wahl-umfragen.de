---
name: write-unit-test
description: 'Write or extend Vitest unit tests for the wahlumfragen app. Use when asked to add unit tests, cover a function/module, or test pure logic (selectors, transforms, formatters, i18n). Knows this project''s convention: colocated *.test.ts next to source, node environment, the @ alias, and the hard rule that unit tests cover PURE logic only — no DB, no network.'
---

# write-unit-test

Unit tests are **Vitest**, **colocated** next to the source they cover as
`*.test.ts` (or `.tsx`), and exist for **pure logic only** — no DB, no network,
no Next runtime. Config: `vitest.config.ts` (node environment, `@` → `src`,
includes `src/**/*.{test,spec}.{ts,tsx}`, excludes `e2e/`).

```bash
npm test              # vitest run (one-shot)
npm run test:watch    # vitest (watch)
npm test -- src/lib/dawum/trend.test.ts   # a single file
```

## What belongs in a unit test (and what doesn't)

**Yes — pure modules.** These are the right targets and already the bulk of the
suite:

- View-model selectors in `src/lib/dawum/` — `normalize`, `aggregate`, `trend`,
  `coalition`, `colors`.
- `src/lib/format.ts`, `src/i18n/`, `src/lib/elections/` (`markers`, `table`).
- **`src/lib/ingest/transform.ts`** — the transform is deliberately kept pure (no
  DB) precisely so it's unit-testable. Side effects live in `run.ts`.

**No — anything with side effects or runtime.** Don't unit-test `run.ts` (DB
writes), `src/lib/data/load.ts` (Postgres + `unstable_cache`), API routes, or
React components that need a browser. DB/runtime behaviour is for **e2e**
(`write-e2e-test`); the dawum **live client** is the one exception that mocks the
network (`src/lib/dawum/client.test.ts` — follow its `vi` mocking pattern if you
must).

If the thing you want to cover isn't pure, the fix is usually to **extract the
pure core** into a testable function (transform-style) and test that, leaving the
side effect thin and untested — consistent with the `transform.ts` / `run.ts`
split.

## House style (match the existing tests)

Read a sibling first — e.g. `src/i18n/index.test.ts` or
`src/lib/ingest/transform.test.ts` — and mirror it:

- `import { describe, expect, it, vi } from "vitest";` then import the unit by
  relative path (`./index`) or the `@` alias.
- `describe("functionName()", () => { it("does the specific thing", …) })`.
- Test names are **full sentences describing the behaviour**, not just the method
  name (e.g. `"falls back to the key string for a missing key"`).
- Add a short comment when a case is non-obvious (why this input, what edge it
  guards) — the existing tests do this and it's the local norm.
- Cover the **edge cases**, not just the happy path: empty input, missing/`null`
  fields, the 5-% threshold and rounding in seat/coalition math, placeholder
  fallbacks. Bugs in this app live in the aggregation edges.
- Build inputs as small inline fixtures shaped like the real types
  (`NormalizedSurvey[]` etc.); don't hit the network or read files.

## Finishing

1. `npm test` green (run the single file while iterating, full suite before
   done).
2. `npm run typecheck` — tests are typechecked too; keep fixtures correctly typed
   rather than casting, except the deliberate "this is a type error at compile
   time, we're exercising the runtime fallback" cast pattern (see `i18n` test).
3. Commit with the `commit-push` skill, `test:` title (e.g.
   `test: cover coalition majority edge cases`).
