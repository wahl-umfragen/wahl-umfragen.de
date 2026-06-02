<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: wahlumfragen

Aggregator for Bundestag polling data from dawum.de (ODbL).

## Data flow — know which path you're touching

1. **Ingest path (writes)** — `scripts/ingest.ts` → `src/lib/ingest/run.ts`
   fetches dawum via `src/lib/dawum/client.ts`, transforms the JSON into row
   shapes (`src/lib/ingest/transform.ts`), and upserts into Postgres. This
   accumulates **historical snapshots** so we keep data after dawum's ~90-day
   window. Runs hourly via the systemd timer in `deploy/`, guarded by dawum's
   `last_update` (see the `ingest_runs` note below).

2. **DB read path (frontend)** — every page route loads via
   `loadBundestagData()` in `src/lib/data/load.ts`, which reads accumulated
   surveys from Postgres and returns the `NormalizedSurvey[]` view model. Phase 2
   is **done**: the frontend reads the DB, not dawum live. There is **no live
   fallback** — an empty DB renders an empty UI. The app needs a reachable,
   migrated DB at **build and runtime**.

**Caching (the classic ISR model, *not* `cacheComponents`).** `loadBundestagData`
is wrapped in `unstable_cache` with the `surveys` tag (`src/lib/data/tags.ts`)
and no time expiry, so pages render statically and are reused across all
requests — cheap at scale. Freshness comes from **on-demand invalidation**: the
ingest worker POSTs `app/api/revalidate` (shared `REVALIDATE_SECRET`) after a
real ingest, which calls `revalidateTag('surveys')`. Any new DB-backed read
must go through a cached, `surveys`-tagged loader so this invalidation reaches
it. Don't make page routes `force-dynamic` — that defeats the caching.

`src/lib/dawum/client.ts` (the live `api.dawum.de` fetch) is now used **only by
the ingest path**, never by the frontend. The pure view-model selectors in
`src/lib/dawum/` (normalize/aggregate/trend/coalition) are shared by both.

## Data layer

- ORM: Drizzle (`drizzle-orm`, `drizzle-kit`)
- Schema lives in `src/db/schema.ts` — single source of truth
- Migrations in `drizzle/` — committed, generated via `npm run db:generate`
- Connection in `src/db/client.ts` — `DATABASE_URL` from `.env`
- `ingest_runs` table is the audit log: each `runIngest()` that actually
  ingests writes start/end timestamps + counts + the dawum `last_update` it
  saw. Query it to see ingest history. Note: `runIngest()` is **guarded** — it
  fetches dawum's cheap `last_update.txt` first and, unless called with
  `{ force: true }`, skips the full fetch+upsert (and writes **no** row) when
  that value hasn't advanced past the newest stored `dawum_last_update`. So a
  skipped run leaves no DB trace — its heartbeat is the worker log (journald),
  not `ingest_runs`. This lets the worker poll hourly cheaply.

## Test layout

- Unit (Vitest) — colocated as `*.test.ts` next to source. Pure logic only.
- E2E (Playwright) — `e2e/` directory. Runs against `npm run start` (built).
  E2E does NOT need a DB right now (frontend still on the live read path).

## When you write new code

- New schema field: edit `src/db/schema.ts` → `npm run db:generate` →
  inspect SQL → `npm run db:migrate`. Commit both the schema and the
  generated migration file.
- New ingest logic: keep the transform pure (no DB) so it's unit-testable.
  Side effects belong in `run.ts`.
- New frontend read of poll data: read from the DB via `@/lib/data`
  (`loadBundestagData`), **not** the live dawum client (that's ingest-only).
  Keep new page routes `dynamic = "force-dynamic"` since they query Postgres at
  request time. Reuse the pure selectors in `@/lib/dawum` on the resulting
  `NormalizedSurvey[]`.
- Postgres parameter limit (~65k): every `tx.insert(...).values([...])` over
  thousands of rows must chunk. See `chunked()` in `src/lib/ingest/run.ts`
  for the existing pattern.
