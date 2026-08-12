#!/usr/bin/env bash
#
# Backs up the JILBER database AND the uploaded product images.
#
#   ./deploy/backup.sh
#
# Both halves matter: the DB stores image PATHS, so a database restored without
# the matching UPLOAD_DIR gives you a catalogue of broken images.
#
# Config via env (or .env in the app dir):
#   DB_NAME             database name                      (default: jilber)
#   DB_HOST             sqlcmd -S target                   (default: localhost)
#   DB_USER / DB_PASS   sqlcmd credentials
#   UPLOAD_DIR          product image directory            (default: /var/lib/jilber/uploads)
#   BACKUP_DIR          where dumps land                   (default: /var/backups/jilber)
#   MSSQL_BACKUP_DIR    path SQL Server itself can write   (default: /var/opt/mssql/backups)
#   RETENTION_DAYS      prune older than this              (default: 14)
#   OFFSITE_DEST        optional rsync/scp destination
#
# NOTE: SQL Server writes BACKUP DATABASE from ITS OWN process, so MSSQL_BACKUP_DIR
# must be writable by the mssql user. If the DB is on another host, that path is on
# that host and you must copy it back yourself.

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/srv/jilber}"
[ -f "$APP_DIR/.env" ] && set -a && . "$APP_DIR/.env" && set +a

DB_NAME="${DB_NAME:-jilber}"
DB_HOST="${DB_HOST:-localhost}"
UPLOAD_DIR="${UPLOAD_DIR:-/var/lib/jilber/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/jilber}"
MSSQL_BACKUP_DIR="${MSSQL_BACKUP_DIR:-/var/opt/mssql/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

STAMP="$(date +%Y%m%d-%H%M%S)"
DB_FILE="${DB_NAME}-${STAMP}.bak"
UPLOADS_FILE="uploads-${STAMP}.tar.gz"

log()  { printf '\033[1;36m[backup]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[backup] FAILED: %s\033[0m\n' "$*" >&2; exit 1; }

command -v sqlcmd >/dev/null || fail "sqlcmd not found (install mssql-tools18)"
[ -n "${DB_USER:-}" ] || fail "DB_USER is not set"
[ -n "${DB_PASS:-}" ] || fail "DB_PASS is not set"

mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
# Backup compression is an Enterprise/Standard feature. On Express, BACKUP
# DATABASE ... WITH COMPRESSION does not degrade gracefully — it aborts the
# whole backup with "Msg 1844: BACKUP DATABASE WITH COMPRESSION is not
# supported on Express Edition", which would leave the store with no backups
# at all. Detect the edition rather than hardcoding, so this keeps producing
# compressed dumps if the database ever moves to Standard or Enterprise.
#
# EngineEdition: 1=Personal 2=Standard 3=Enterprise/Developer 4=Express
ENGINE_EDITION="$(sqlcmd -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASS" -C -b -h -1 -W \
  -Q "SET NOCOUNT ON; SELECT CONVERT(varchar(2), SERVERPROPERTY('EngineEdition'));" 2>/dev/null \
  | tr -dc '0-9' | head -c 2)"

if [ "$ENGINE_EDITION" = "4" ]; then
  COMPRESSION_OPT=""
  log "Express Edition detected — writing an uncompressed backup"
else
  COMPRESSION_OPT=", COMPRESSION"
fi

log "Backing up database '$DB_NAME'"
sqlcmd -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASS" -C -b -Q \
  "BACKUP DATABASE [$DB_NAME] TO DISK = N'${MSSQL_BACKUP_DIR}/${DB_FILE}' WITH INIT${COMPRESSION_OPT}, CHECKSUM, STATS = 10;" \
  || fail "BACKUP DATABASE failed"

# Verify the dump is readable BEFORE we count it as a backup.
log "Verifying backup integrity"
sqlcmd -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASS" -C -b -Q \
  "RESTORE VERIFYONLY FROM DISK = N'${MSSQL_BACKUP_DIR}/${DB_FILE}';" \
  || fail "RESTORE VERIFYONLY failed — the dump is not restorable"

if [ "$MSSQL_BACKUP_DIR" != "$BACKUP_DIR" ] && [ -f "${MSSQL_BACKUP_DIR}/${DB_FILE}" ]; then
  mv "${MSSQL_BACKUP_DIR}/${DB_FILE}" "${BACKUP_DIR}/${DB_FILE}"
fi

# ---------------------------------------------------------------------------
# Uploaded images
# ---------------------------------------------------------------------------
if [ -d "$UPLOAD_DIR" ]; then
  log "Backing up uploads from $UPLOAD_DIR"
  tar -czf "${BACKUP_DIR}/${UPLOADS_FILE}" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" \
    || fail "uploads tarball failed"
else
  log "WARNING: UPLOAD_DIR $UPLOAD_DIR does not exist — skipping uploads"
fi

# ---------------------------------------------------------------------------
# Off-box copy. A backup that only exists on the box it protects is not a backup.
# ---------------------------------------------------------------------------
if [ -n "${OFFSITE_DEST:-}" ]; then
  log "Copying off-box to $OFFSITE_DEST"
  rsync -av --remove-source-files=no \
    "${BACKUP_DIR}/${DB_FILE}" \
    ${UPLOADS_FILE:+"${BACKUP_DIR}/${UPLOADS_FILE}"} \
    "$OFFSITE_DEST" || fail "off-box copy failed"
else
  log "WARNING: OFFSITE_DEST is not set — backups exist only on this host"
fi

# ---------------------------------------------------------------------------
# Prune
# ---------------------------------------------------------------------------
log "Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name "${DB_NAME}-*.bak" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime "+${RETENTION_DAYS}" -delete

log "Done: ${BACKUP_DIR}/${DB_FILE}"
ls -lh "${BACKUP_DIR}/${DB_FILE}"
