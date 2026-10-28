#!/usr/bin/env bash
#
# Wrapper for every scheduled job. Keeps full output in a log file, and prints
# to STDOUT *only* when the job fails.
#
#   ./deploy/cron-run.sh /var/log/jilber/backup.log ./deploy/backup.sh
#
# Install it somewhere cron can reach:
#   sudo install -m 755 deploy/cron-run.sh /usr/local/bin/jilber-cron-run
#
# WHY THIS EXISTS
# cron decides whether to send mail based on whether a job produced OUTPUT —
# not on its exit status. The obvious crontab line:
#
#   10 22 * * * cd $APP_DIR && ./deploy/backup.sh >> /var/log/jilber/backup.log 2>&1
#
# sends every byte to the log, so cron sees nothing and mails nobody. The backup
# can fail every night for a year and MAILTO stays silent. That is the failure
# this wrapper exists to prevent: you would believe you had backups, and find
# out otherwise on the day you needed one.
#
# Delivery requires an MTA. See docs/deployment.md for the msmtp + SMTP relay
# setup; without one, cron composes the mail and then discards it.

set -uo pipefail

LOG="${1:-}"
[ -n "$LOG" ] || { echo "usage: $0 <logfile> <command...>"; exit 2; }
shift
[ "$#" -gt 0 ] || { echo "usage: $0 <logfile> <command...>"; exit 2; }

APP_DIR="${APP_DIR:-/srv/jilber}"
cd "$APP_DIR" || { echo "cron-run: cannot cd to $APP_DIR"; exit 1; }

start="$(date -u +'%Y-%m-%d %H:%M:%S UTC')"
out="$("$@" 2>&1)"
rc=$?

{
  echo "=== $start :: $* (exit $rc) ==="
  printf '%s\n' "$out"
} >> "$LOG" 2>/dev/null

if [ "$rc" -ne 0 ]; then
  # Everything below is what cron turns into the alert mail.
  echo "SCHEDULED JOB FAILED on $(hostname -s)"
  echo "  command : $*"
  echo "  exit    : $rc"
  echo "  started : $start"
  echo "  log     : $LOG"
  echo
  echo "--- output (last 40 lines) ---"
  printf '%s\n' "$out" | tail -40
fi

exit "$rc"
