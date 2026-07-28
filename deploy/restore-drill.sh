#!/usr/bin/env bash
#
# RESTORE DRILL — proves a backup is actually restorable.
#
#   ./deploy/restore-drill.sh /var/backups/jilber/jilber-20260728-030000.bak
#
# An untested backup is not a backup. This restores the dump into a SCRATCH
# database (never the live one), sanity-checks the row counts, and drops it again.
# Run it after the first backup and on a schedule (monthly is reasonable), and
# record the date in docs/deployment.md.
#
# It refuses to touch DB_NAME, so it cannot destroy production by mistake.

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/srv/jilber}"
[ -f "$APP_DIR/.env" ] && set -a && . "$APP_DIR/.env" && set +a

BACKUP_FILE="${1:-}"
DB_NAME="${DB_NAME:-jilber}"
DB_HOST="${DB_HOST:-localhost}"
SCRATCH_DB="${SCRATCH_DB:-jilber_restore_drill}"
RESTORE_DATA_DIR="${RESTORE_DATA_DIR:-/var/opt/mssql/data}"

log()  { printf '\033[1;36m[drill]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[drill] FAILED: %s\033[0m\n' "$*" >&2; exit 1; }

[ -n "$BACKUP_FILE" ] || fail "usage: $0 /path/to/backup.bak"
[ -n "${DB_USER:-}" ] || fail "DB_USER is not set"
[ -n "${DB_PASS:-}" ] || fail "DB_PASS is not set"

# Hard guard: never restore over the live database.
[ "$SCRATCH_DB" != "$DB_NAME" ] || fail "SCRATCH_DB must not equal DB_NAME ($DB_NAME)"

sq() { sqlcmd -S "$DB_HOST" -U "$DB_USER" -P "$DB_PASS" -C -b "$@"; }

log "Reading logical file names from $BACKUP_FILE"
FILELIST="$(sq -h -1 -W -Q "RESTORE FILELISTONLY FROM DISK = N'${BACKUP_FILE}';")" \
  || fail "cannot read the backup — it may be corrupt"

DATA_LOGICAL="$(echo "$FILELIST" | awk '$2 ~ /\.mdf$/ {print $1; exit}')"
LOG_LOGICAL="$(echo "$FILELIST"  | awk '$2 ~ /\.ldf$/ {print $1; exit}')"
[ -n "$DATA_LOGICAL" ] && [ -n "$LOG_LOGICAL" ] || fail "could not parse logical file names"
log "  data=$DATA_LOGICAL log=$LOG_LOGICAL"

log "Restoring into scratch database '$SCRATCH_DB'"
sq -Q "
IF DB_ID('${SCRATCH_DB}') IS NOT NULL
BEGIN
  ALTER DATABASE [${SCRATCH_DB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  DROP DATABASE [${SCRATCH_DB}];
END
RESTORE DATABASE [${SCRATCH_DB}]
  FROM DISK = N'${BACKUP_FILE}'
  WITH MOVE N'${DATA_LOGICAL}' TO N'${RESTORE_DATA_DIR}/${SCRATCH_DB}.mdf',
       MOVE N'${LOG_LOGICAL}'  TO N'${RESTORE_DATA_DIR}/${SCRATCH_DB}_log.ldf',
       RECOVERY, STATS = 10;
" || fail "RESTORE failed"

log "Sanity-checking restored contents"
sq -Q "
USE [${SCRATCH_DB}];
SELECT 'users'    AS entity, COUNT(*) AS rows FROM [User]
UNION ALL SELECT 'products', COUNT(*) FROM [Product]
UNION ALL SELECT 'orders',   COUNT(*) FROM [Order]
UNION ALL SELECT 'orderItems', COUNT(*) FROM [OrderItem]
UNION ALL SELECT 'quotes',   COUNT(*) FROM [Quote];
" || fail "restored database is missing expected tables"

# The migration table proves schema history survived, not just the rows.
log "Verifying migration history"
sq -Q "USE [${SCRATCH_DB}]; SELECT TOP 5 migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC;" \
  || fail "_prisma_migrations is missing — schema history did not survive"

log "Dropping scratch database"
sq -Q "
ALTER DATABASE [${SCRATCH_DB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE [${SCRATCH_DB}];
" || fail "could not drop the scratch database — clean it up manually"

log "RESTORE DRILL PASSED for $BACKUP_FILE"
log "Record today's date in docs/deployment.md as the last verified restore."
