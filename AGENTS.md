<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: wahlumfragen

Aggregator for Bundestag polling data from dawum.de (ODbL).

## Two data paths — know which one you're touching

There are **two** ways data flows through this codebase. They serve different purposes:

1. **Live read path** — `src/lib/dawum/client.ts` hits `api.dawum.de` directly
   from the Next server with `fetch(... { next: { revalidate: 900 } })`. The
   home page currently uses this. It's stateless and works without a DB.

2. **Ingest path** — `scripts/ingest.ts` → `src/lib/ingest/run.ts` calls the
   same dawum client, transforms the JSON into row shapes
   (`src/lib/ingest/transform.ts`), and upserts into Postgres. This is what
   accumulates **historical snapshots** so we keep data after dawum's window.

Frontend reads have **not yet been migrated** to the DB. Phase 2 will do that
once we have a hosted Postgres. For now: ingest runs against the local docker
compose Postgres so we start gathering history.

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
- New frontend read of poll data: until phase 2, **use the dawum client**,
  not the DB. We'll do one focused migration when prod DB exists, not a
  drip-feed.
- Postgres parameter limit (~65k): every `tx.insert(...).values([...])` over
  thousands of rows must chunk. See `chunked()` in `src/lib/ingest/run.ts`
  for the existing pattern.
