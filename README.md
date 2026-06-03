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

Die Next-App liest die Umfragedaten aus **Postgres** (`loadBundestagData()` in
`src/lib/data/load.ts`) — nicht mehr live von dawum. Die Seiten-Routen sind
`dynamic`, fragen die DB also pro Request ab. Eine leere DB ergibt eine leere
UI (kein Live-Fallback). Heißt: Die App braucht eine erreichbare, migrierte DB
zum Bauen **und** Laufen.

Befüllt wird die DB vom **Ingest-Worker** (`scripts/ingest.ts` →
`runIngest()`), der stündlich läuft (systemd-Timer in `deploy/`) und Snapshots
akkumuliert, damit Daten über dawums ~90-Tage-Fenster hinaus erhalten bleiben.
`src/lib/dawum/client.ts` (der Live-dawum-Fetch) wird jetzt nur noch vom Ingest
genutzt.

`runIngest()`:

- prüft zuerst dawums `last_update.txt` und überspringt den vollen Lauf, wenn
  sich nichts geändert hat (`--force` erzwingt ihn)
- holt sonst die volle dawum-DB
- upserted Dimensionen + Surveys + Results in einer Transaktion (gechunkt,
  damit pg's 65k-Param-Limit nicht greift)
- setzt `first_seen_at` beim ersten Auftauchen einer Survey-ID und
  `last_seen_at = now()` bei jedem weiteren Lauf
- protokolliert pro tatsächlichem Lauf eine Zeile in `ingest_runs`
  (seen/new/updated + `dawum_last_update`); übersprungene Läufe schreiben nichts

Deployment des Workers auf einem Linux-Server: siehe [`deploy/README.md`](deploy/README.md).

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

Dieses Projekt ist **dual lizenziert** — Code und Daten getrennt:

- **Code:** [MIT](LICENSE) © 2026 mike96841. Frei nutzbar/forkbar; Copyright-Hinweis
  muss erhalten bleiben.
- **Daten:** Die Umfragedaten stammen von [dawum.de](https://dawum.de/) und stehen
  unter der [Open Database License (ODbL) v1.0](https://opendatacommons.org/licenses/odbl/1-0/).
  Die MIT-Lizenz gilt **nicht** für die Daten. Wer die hier aggregierten/exportierten
  Daten (inkl. `/api/surveys` CSV/JSON-Export und der Test-Fixtures in
  `src/lib/dawum/fixtures.ts`) weiterverwendet, muss die ODbL einhalten:
  Attribution von dawum.de **und** Share-Alike für abgeleitete Datenbanken.
