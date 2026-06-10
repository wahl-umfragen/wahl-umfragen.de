#!/usr/bin/env bash
#
# Server-side deploy steps, run over SSH by .github/workflows/deploy.yml (or by
# hand). Assumes the repo is already checked out at the deploy path and the
# desired ref has ALREADY been checked out by the caller — this script does the
# install / migrate / build / restart, not the git checkout, so the version of
# this script that runs is the one being deployed.
#
# Env (with defaults):
#   DEPLOY_PATH   repo location           (default /opt/wahlumfragen)
#   APP_DEPLOY    "1" to rebuild+restart the Dockerised app (default "1")

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/wahlumfragen}"
APP_DEPLOY="${APP_DEPLOY:-1}"

cd "${DEPLOY_PATH}"
echo "[deploy] $(git rev-parse --short HEAD) in ${DEPLOY_PATH}"

# Install exactly what the lockfile pins.
npm ci

# Apply any new migrations before new code touches the schema.
npm run db:migrate

# Rebuild the standalone ingest bundle; the systemd timer picks it up next run.
npm run build:ingest

if [ "${APP_DEPLOY}" = "1" ] && docker compose version >/dev/null 2>&1; then
  # Rebuild and restart the Dockerised Next app. The build statically renders
  # DB-backed pages, so Postgres must be up + migrated first (it is, above).
  echo "[deploy] rebuilding app container"
  docker compose --profile app up -d --build app
else
  echo "[deploy] skipping app container (APP_DEPLOY=${APP_DEPLOY} / no docker compose)"
fi

echo "[deploy] done"
