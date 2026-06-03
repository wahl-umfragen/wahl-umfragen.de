---
name: local-dev
description: 'Bring up the wahlumfragen app locally or for a production-build check. Use when asked to run/start the app, reproduce something in the browser, or verify a change in the real app. Handles this project''s hard requirement: a reachable, migrated, NON-EMPTY Postgres at both build and runtime (empty DB renders an empty UI — there is no live fallback). The built-in `run` skill should defer to this.'
---

# local-dev

The frontend reads poll data from **Postgres** via `loadBundestagData()`
(`src/lib/data/load.ts`), not live from dawum. Consequences you must respect:

- The app needs a reachable, **migrated** DB at **build and runtime**.
- An empty DB renders an **empty UI** — there is no live fallback. If pages look
  blank, the DB is empty, not broken: ingest first.

## First, check what's already running

A dev server may already be up on **:3000** (Next picks the next free port and
logs it if 3000 is taken). Before starting another, check — don't blindly spawn a
second one. If you only need to view the app and a server is already running, just
open it.

## Cold bring-up (fresh clone / empty DB)

```bash
# 1. env (once)
cp .env.example .env          # only if .env is missing

# 2. local Postgres (docker)
npm run db:up                 # waits on healthcheck
npm run db:migrate            # apply committed migrations

# 3. populate — otherwise the UI is empty
npm run ingest                # one-shot pull from dawum.de

# 4. run
npm run dev                   # http://localhost:3000
```

## Production-build check

`next build` also reads the DB (pages prerender from it). Same prerequisites:
Postgres up, migrated, and ideally ingested so prerendered pages have content.

```bash
npm run build && npm run start
```

## Notes

- **Caching:** pages are statically rendered and cached, with `loadBundestagData`
  wrapped in `unstable_cache` (tag `surveys`). After changing DB rows directly,
  the frontend won't reflect it until the `surveys` tag is busted — POST
  `/api/revalidate` (with `x-revalidate-secret`) or restart the dev server. Do
  **not** make page routes `force-dynamic` to "fix" staleness — that defeats the
  caching model (see AGENTS.md).
- **E2E** (`npm run test:e2e`) runs against the built app (`npm run start`) and
  does not currently need a DB.
- Stop the stack with `npm run db:down` (drops the volume too).
- To refresh data, see the `ingest` skill.
