#!/usr/bin/env bash
#
# Postgres backup for wahlumfragen. The DB accumulates polling history BEYOND
# dawum's ~90-day API window (see ../AGENTS.md), so a lost `pgdata` volume means
# unrecoverable data — this is the most important ops job on the box.
#
# Dumps the database (custom format, compressed) via the running postgres
# container, then prunes dumps older than the retention window. Designed to be
# run from wahlumfragen-backup.service (systemd timer), but is safe to run by
# hand.
#
# Configuration (all optional, sensible defaults):
#   BACKUP_DIR        where dumps land            (default /opt/wahlumfragen/backups)
#   BACKUP_KEEP_DAYS  prune dumps older than this (default 14)
#   PG_CONTAINER      postgres container name      (default wahlumfragen-postgres)
#   PG_USER / PG_DB   role / database to dump      (default wahlumfragen / wahlumfragen)
#
# Restore (custom-format dump):
#   gunzip -c wahlumfragen-YYYYmmdd-HHMMSS.dump.gz \
#     | docker exec -i wahlumfragen-postgres pg_restore -U wahlumfragen \
#         --clean --if-exists -d wahlumfragen

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/wahlumfragen/backups}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
PG_CONTAINER="${PG_CONTAINER:-wahlumfragen-postgres}"
PG_USER="${PG_USER:-wahlumfragen}"
PG_DB="${PG_DB:-wahlumfragen}"

timestamp="$(date +%Y%m%d-%H%M%S)"
outfile="${BACKUP_DIR}/wahlumfragen-${timestamp}.dump.gz"
tmpfile="${outfile}.partial"

mkdir -p "${BACKUP_DIR}"

# Custom format (-Fc) for flexible pg_restore; pipe straight through gzip.
# Write to a .partial file first so an interrupted run never leaves a truncated
# dump that the retention step might keep while deleting a good older one.
if ! docker exec "${PG_CONTAINER}" pg_dump -U "${PG_USER}" -Fc "${PG_DB}" \
  | gzip > "${tmpfile}"; then
  echo "[backup] pg_dump failed" >&2
  rm -f "${tmpfile}"
  exit 1
fi

# A valid compressed custom-format dump is never near-empty; guard against a
# silent 0-byte/garbage result before we trust it and rotate.
if [ ! -s "${tmpfile}" ] || [ "$(stat -c%s "${tmpfile}")" -lt 100 ]; then
  echo "[backup] dump looks empty/too small — refusing to keep it" >&2
  rm -f "${tmpfile}"
  exit 1
fi

mv "${tmpfile}" "${outfile}"
echo "[backup] wrote ${outfile} ($(du -h "${outfile}" | cut -f1))"

# Prune old dumps. Only ours, only after a successful new backup.
deleted="$(find "${BACKUP_DIR}" -maxdepth 1 -name 'wahlumfragen-*.dump.gz' \
  -type f -mtime "+${BACKUP_KEEP_DAYS}" -print -delete | wc -l)"
echo "[backup] pruned ${deleted} dump(s) older than ${BACKUP_KEEP_DAYS} day(s)"
