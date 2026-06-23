# wahlumfragen

Aggregated "Sonntagsfrage" (federal election polling) for the German
Bundestag, based on the free [dawum.de](https://dawum.de/) API (ODbL).

## Stack

- Next.js 16 (App Router, Tailwind v4)
- Drizzle ORM + Postgres 16 (local via docker compose)
- Recharts for the trend
- Vitest (unit) + Playwright (e2e)
- GitHub Actions CI

## Setup

```bash
# 1. install
npm install

# 2. local postgres
cp .env.example .env
npm run db:up
npm run db:migrate

# 3. pull data once
npm run ingest

# 4. start the app
npm run dev
```

## Data flow

The Next app reads the polling data from **Postgres** (`loadBundestagData()`
in `src/lib/data/load.ts`) — no longer live from dawum. An empty DB yields an
empty UI (no live fallback). This means the app needs a reachable, migrated DB
to **build** *and* **run**.

**Caching (classic ISR, not per-request queries).** The loader is wrapped in
`unstable_cache` with the `surveys` tag and no time expiry: the page routes are
rendered **statically** and reused across all requests — cheap under load.
Freshness comes from **on-demand invalidation**: after a real ingest the worker
POSTs to `/api/revalidate` (shared `REVALIDATE_SECRET`), which triggers
`revalidateTag('surveys')` and re-renders the affected pages. The routes are
deliberately **not** `force-dynamic` — that would defeat the caching. The cached
value is stored **gzip-compressed** (base64 of the zipped JSON), because Next's
Data Cache rejects entries over 2 MB and the accumulated history has grown past
that; it is decompressed exactly once per request via React `cache()`.

The DB is populated by the **ingest worker** (`scripts/ingest.ts` →
`runIngest()`), which runs hourly (systemd timer in `deploy/`) and mirrors
dawum's full dataset (all polls since 2017) into Postgres. The point is to
decouple the frontend from dawum's live API — the site reads from our own DB for
resilience and cheap ISR caching, not to retain data dawum would otherwise drop
(it drops nothing). `src/lib/dawum/client.ts` (the live dawum fetch) is now used
only by the ingest path.

`runIngest()`:

- first checks dawum's `last_update.txt` and skips the full run when nothing has
  changed (`--force` forces it)
- otherwise fetches the full dawum DB
- upserts dimensions + surveys + results in a single transaction (chunked, so
  pg's 65k parameter limit doesn't bite)
- sets `first_seen_at` the first time a survey ID appears and
  `last_seen_at = now()` on every subsequent run
- logs one row per actual run in `ingest_runs` (seen/new/updated +
  `dawum_last_update`); skipped runs write nothing

Deploying the worker on a Linux server: see [`deploy/README.md`](deploy/README.md).

## Common commands

| Command                | What it does                                |
|------------------------|---------------------------------------------|
| `npm run dev`          | Next.js dev server on :3000                 |
| `npm run build`        | Production build                            |
| `npm run lint`         | ESLint                                      |
| `npm run typecheck`    | `tsc --noEmit`                              |
| `npm test`             | Vitest (unit)                               |
| `npm run test:e2e`     | Playwright (e2e)                            |
| `npm run db:up`        | Start Postgres in docker compose            |
| `npm run db:down`      | Stop Postgres + volume                      |
| `npm run db:generate`  | Generate migration from schema diff         |
| `npm run db:migrate`   | Apply pending migrations                    |
| `npm run db:studio`    | Drizzle Studio (web UI for the DB)          |
| `npm run ingest`       | One-off ingest run against dawum.de         |

## License / sources

This project is **dual licensed** — code and data separately:

- **Code:** [MIT](LICENSE) © 2026 Mike Grab (wahl-umfragen). Free to use/fork;
  the copyright notice must be retained.
- **Data:** The polling data comes from [dawum.de](https://dawum.de/) and is
  licensed under the [Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/).
  The MIT license does **not** apply to the data. Anyone reusing the data
  aggregated/exported here (including the `/api/surveys` CSV/JSON export and the
  test fixtures in `src/lib/dawum/fixtures.ts`) must comply with the ODbL:
  attribution to dawum.de **and** share-alike for derived databases.
- **Official election results:** The official results shown for comparison in
  the trend chart (`src/lib/elections/results.ts`) come from
  [Die Bundeswahlleiterin](https://www.bundeswahlleiterin.de/) — official data,
  used with attribution.
