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
#
# The app image is built with `--network=host` so the build (which statically
# renders DB-backed pages) reaches Postgres on the host's 127.0.0.1:5432 — we
# deliberately bind Postgres to loopback only (see docker-compose.override.yml
# on the server), so the old host.docker.internal build path is not used here.
# The server's compose override pins `image: wahlumfragen-app:local`, so
# `docker compose up` reuses this freshly built image instead of rebuilding.

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/opt/wahlumfragen}"
APP_DEPLOY="${APP_DEPLOY:-1}"
APP_IMAGE="${APP_IMAGE:-wahlumfragen-app:local}"

cd "${DEPLOY_PATH}"
echo "[deploy] $(git rev-parse --short HEAD) in ${DEPLOY_PATH}"

# Install exactly what the lockfile pins.
npm ci

# Postgres must be up + migrated before the DB-backed build and before new code
# touches the schema. Bring it up (no-op if already running), then migrate.
docker compose up -d postgres
npm run db:migrate

# Rebuild the standalone ingest bundle; the systemd timer picks it up next run.
npm run build:ingest

if [ "${APP_DEPLOY}" = "1" ] && docker compose version >/dev/null 2>&1; then
  echo "[deploy] building app image ${APP_IMAGE} (host network -> loopback Postgres)"

  # Pull build-time config from .env WITHOUT sourcing it (values like SMTP_PASS
  # may contain shell-special characters). Only DATABASE_URL + NEXT_PUBLIC_* are
  # needed at build time; NEXT_PUBLIC_* get inlined into the client bundle.
  envval() { grep -E "^$1=" .env | head -1 | cut -d= -f2-; }

  docker build --network=host \
    --build-arg DATABASE_URL="$(envval DATABASE_URL)" \
    --build-arg NEXT_PUBLIC_SITE_URL="$(envval NEXT_PUBLIC_SITE_URL)" \
    --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY="$(envval NEXT_PUBLIC_TURNSTILE_SITE_KEY)" \
    --build-arg NEXT_PUBLIC_COUNTLESS_SITE="$(envval NEXT_PUBLIC_COUNTLESS_SITE)" \
    --build-arg NEXT_PUBLIC_COUNTLESS_SRC="$(envval NEXT_PUBLIC_COUNTLESS_SRC)" \
    -t "${APP_IMAGE}" .

  echo "[deploy] restarting app container"
  docker compose --profile app up -d --force-recreate app
else
  echo "[deploy] skipping app container (APP_DEPLOY=${APP_DEPLOY} / no docker compose)"
fi

echo "[deploy] done"
