# Deploying the ingest service (Linux)

The ingest accumulates dawum's polling data into Postgres so we keep history
beyond dawum's ~90-day API window. dawum never returns surveys older than that,
so the ingest must run **regularly on an always-on host** — once a gap is longer
than the window, surveys published and dropped within it are lost for good.

This sets it up as a **systemd timer** on the same Linux server that runs the
Postgres container and (later) the Next app. Everything is self-hosted — no
managed/cloud database, no extra cost.

## How it runs

The ingest is compiled to a single self-contained file via esbuild:

```bash
npm run build:ingest   # -> dist/ingest.cjs
```

It is then run with plain Node, reusing the repo's `node_modules` (pg,
drizzle-orm, dotenv stay external — they're already installed for the app):

```bash
node dist/ingest.cjs   # == npm run ingest:prod
```

`dist/` is git-ignored — it's a build artifact, rebuilt on each deploy.

## One-time server setup

Assumes the repo is checked out at `/opt/wahlumfragen`, owned by a system user
`wahlumfragen`, with Node 22 installed. Adjust paths to your layout.

```bash
cd /opt/wahlumfragen

# 1. Postgres (persistent docker volume `pgdata`)
docker compose up -d postgres

# 2. Environment — create .env with the server's DB URL
echo 'DATABASE_URL=postgresql://wahlumfragen:wahlumfragen@localhost:5432/wahlumfragen' > .env

# 3. Install deps, run migrations, build the ingest bundle
npm ci
npm run db:migrate
npm run build:ingest

# 4. Smoke-test one run by hand
npm run ingest:prod
#  -> [ingest] ok  seen=...  new=...  updated=...  <ms>  run=<uuid>
```

## Install the timer

Edit the three placeholders in `wahlumfragen-ingest.service`
(`User=`, `WorkingDirectory=`, `ExecStart=` — set the node path from
`which node`), then:

```bash
sudo cp deploy/wahlumfragen-ingest.service /etc/systemd/system/
sudo cp deploy/wahlumfragen-ingest.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now wahlumfragen-ingest.timer
```

Enable the **timer**, not the service — the service is one-shot and is launched
by the timer.

## Operating it

```bash
# When does it next run? When did it last run?
systemctl list-timers wahlumfragen-ingest.timer

# Trigger a run right now (e.g. after a deploy)
sudo systemctl start wahlumfragen-ingest.service

# Logs of the last run
journalctl -u wahlumfragen-ingest.service -n 50 --no-pager
```

Every run is also recorded in the `ingest_runs` audit table — query it to see
history, including failures (the `error` column):

```sql
SELECT started_at, completed_at, surveys_seen, surveys_new, surveys_updated, error
FROM ingest_runs ORDER BY started_at DESC LIMIT 10;
```

## Redeploying after a code change

```bash
cd /opt/wahlumfragen
git pull
npm ci
npm run db:migrate      # no-op if no new migrations
npm run build:ingest    # rebuild dist/ingest.cjs
# the timer picks up the new bundle on its next run; no systemctl change needed
```
