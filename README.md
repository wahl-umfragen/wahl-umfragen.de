# wahlumfragen

Aggregierte Sonntagsfrage zur Bundestagswahl, basierend auf der freien
[dawum.de](https://dawum.de/)-API (ODbL).

## Stack

- Next.js 16 (App Router, Tailwind v4)
- Drizzle ORM + Postgres 16 (lokal via docker compose)
- Recharts für den Trend
- Vitest (Unit) + Playwright (E2E)
- GitHub Actions CI

## Setup

```bash
# 1. install
npm install

# 2. lokale postgres
cp .env.example .env
npm run db:up
npm run db:migrate

# 3. einmalig daten ziehen
npm run ingest

# 4. app starten
npm run dev
```

## Daten-Flow

Aktuell liest die Next-App die dawum-API direkt mit 15 min Revalidate-Cache
(`src/lib/dawum/client.ts`). Parallel dazu schreibt das Ingest-Script in eine
lokale Postgres (`scripts/ingest.ts`), damit wir Snapshots akkumulieren,
bevor die Frontend-Reads später auf die DB migrieren.

`runIngest()`:

- holt die volle dawum-DB einmalig
- upserted Dimensionen + Surveys + Results in einer Transaktion (gechunkt,
  damit pg's 65k-Param-Limit nicht greift)
- setzt `first_seen_at` beim ersten Auftauchen einer Survey-ID und
  `last_seen_at = now()` bei jedem weiteren Lauf
- protokolliert pro Lauf eine Zeile in `ingest_runs` (seen/new/updated)

## Häufige Commands

| Command                | Was es macht                                |
|------------------------|---------------------------------------------|
| `npm run dev`          | Next.js dev server auf :3000                |
| `npm run build`        | Production build                            |
| `npm run lint`         | ESLint                                      |
| `npm run typecheck`    | `tsc --noEmit`                              |
| `npm test`             | Vitest (unit)                               |
| `npm run test:e2e`     | Playwright (e2e)                            |
| `npm run db:up`        | Postgres in docker compose hochfahren       |
| `npm run db:down`      | Postgres + Volume runterfahren              |
| `npm run db:generate`  | Migration aus Schema-Diff erzeugen          |
| `npm run db:migrate`   | Pending migrations anwenden                 |
| `npm run db:studio`    | Drizzle Studio (Web-UI für die DB)          |
| `npm run ingest`       | Einmaliger Ingest-Lauf gegen dawum.de       |

## Lizenz / Quellen

Daten von [dawum.de](https://dawum.de/) unter
[ODC-ODbL](https://opendatacommons.org/licenses/odbl/1-0/).
