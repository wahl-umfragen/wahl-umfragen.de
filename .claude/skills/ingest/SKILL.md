---
name: ingest
description: 'Run or debug the dawum.de → Postgres ingest. Use when asked to refresh/pull poll data, force a re-ingest, investigate why data is stale or missing, or read the ingest audit history. Knows the guard/skip behaviour (skipped runs leave no DB trace), the --force flag, the ingest_runs audit log, and the post-ingest cache revalidation.'
---

# ingest

The ingest worker pulls dawum's full database, upserts dimensions + surveys +
results into Postgres in one chunked transaction, and mirrors dawum's full
dataset (all polls since 2017) so the frontend reads from our own DB instead of
dawum's live API — decoupling + ISR caching, not retention (dawum drops
nothing). Entry point:
`scripts/ingest.ts` → `runIngest()` in `src/lib/ingest/run.ts`. The transform
(`src/lib/ingest/transform.ts`) is pure; side effects live in `run.ts`.

In production it runs hourly via the systemd timer in `deploy/`.

## Run it

```bash
npm run ingest              # one-shot, guarded
npm run ingest -- --force   # bypass the change-guard, force a full fetch+upsert
```

Requires a reachable, migrated DB (`npm run db:up && npm run db:migrate`).

## Reading the output (the guard is the key subtlety)

`runIngest()` first fetches dawum's cheap `last_update.txt`. Unless `--force`,
it **skips** the full fetch+upsert when that value hasn't advanced past the
newest stored `dawum_last_update`:

- `[ingest] no change  dawum_last_update=…` → **skipped**. Writes **no**
  `ingest_runs` row — a skipped run leaves no DB trace; its only heartbeat is the
  log (journald in prod). "No new row" ≠ "worker is broken".
- `[ingest] ok  seen=… new=… updated=… run=…` → a real ingest ran, wrote an
  `ingest_runs` audit row, and (if `REVALIDATE_URL`/`REVALIDATE_SECRET` are set)
  POSTed `/api/revalidate` to bust the frontend `surveys` cache tag.

So: data looks stale but every run says "no change"? That's expected when dawum
hasn't published. To prove the pipeline end-to-end, run with `--force`.

## Audit history

`ingest_runs` is the audit log (start/end, seen/new/updated counts, the
`dawum_last_update` seen). Inspect it via `npm run db:studio` or a SQL query —
only **real** (non-skipped) runs appear there.

## Frontend not updating after an ingest?

A real ingest triggers revalidation only when `REVALIDATE_URL` +
`REVALIDATE_SECRET` are configured (see `.env.example`). Without them the data is
in the DB but the statically-cached pages stay stale until the tag is busted —
POST `/api/revalidate` manually or restart the app.

## Gotchas

- **Postgres ~65k bind-parameter limit:** bulk inserts must chunk. The existing
  `chunked()` helper (`CHUNK_SIZE = 1000`) in `run.ts` is the pattern — reuse it
  for any new bulk write.
- Keep new ingest logic split: pure shaping in `transform.ts` (unit-testable, no
  DB), side effects in `run.ts`.
