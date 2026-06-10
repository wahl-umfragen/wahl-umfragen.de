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

## Cadence & the change guard

The timer fires **hourly** (`OnCalendar=hourly`). Each run first fetches
dawum's cheap `last_update.txt`; if it hasn't advanced since the last ingest,
the run **skips** the full fetch+upsert in ~200ms and writes no `ingest_runs`
row (its trace is the journald log line, not the DB). So hourly polling is
cheap and polite to dawum — the heavy work only happens when dawum actually
published something. Pass `--force` to ingest regardless of the guard.

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

# 4. Smoke-test one run by hand (--force bypasses the change guard)
node dist/ingest.cjs --force
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

## Database backups

The DB accumulates polling history **beyond dawum's ~90-day window**, so it is
not reproducible — a lost `pgdata` volume loses data for good. `backup-db.sh`
dumps Postgres (custom format, gzipped) and prunes old dumps; a systemd timer
runs it daily.

```bash
# Install (alongside the ingest units)
sudo cp deploy/wahlumfragen-backup.service deploy/wahlumfragen-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now wahlumfragen-backup.timer

# Run one backup right now
sudo systemctl start wahlumfragen-backup.service
journalctl -u wahlumfragen-backup.service -n 20 --no-pager
```

Defaults: dumps to `/opt/wahlumfragen/backups`, keeps 14 days. Override via the
repo `.env` (`BACKUP_DIR`, `BACKUP_KEEP_DAYS`). **Copy the dumps off-box** (rsync
to another host / object storage) for real durability — a backup on the same
disk dies with it.

Restore a dump:

```bash
gunzip -c backups/wahlumfragen-YYYYmmdd-HHMMSS.dump.gz \
  | docker exec -i wahlumfragen-postgres pg_restore -U wahlumfragen \
      --clean --if-exists -d wahlumfragen
```

## Automated deploy (GitHub Actions over SSH)

`.github/workflows/deploy.yml` deploys to this server when a GitHub Release is
published (release-please cuts those) or via a manual run. It SSHes in, checks
out the target ref, and runs `deploy/remote-deploy.sh` (npm ci → migrate →
build ingest → rebuild+restart the app container).

One-time setup: create a **`production`** environment in the repo settings
(optionally require approval) and add these secrets to it:

| Secret           | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `DEPLOY_HOST`    | server hostname / IP                               |
| `DEPLOY_USER`    | SSH user (in the `docker` group, owns the repo)    |
| `DEPLOY_SSH_KEY` | private key whose public half is in the user's `authorized_keys` |
| `DEPLOY_PATH`    | repo path on the server (optional, default `/opt/wahlumfragen`) |
| `DEPLOY_PORT`    | SSH port (optional, default `22`)                  |

The SSH user needs passwordless access to the listed steps (npm, docker
compose, the migrate command). Set `APP_DEPLOY=0` in the repo `.env` to skip the
container rebuild if you serve the app some other way.
