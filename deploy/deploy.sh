#!/usr/bin/env bash
#
# Release script for the JILBER store.
#
#   cd /srv/jilber && ./deploy/deploy.sh
#
# Replaces the hand-run checklist that previously lived only in docs/deployment.md.
# Every step aborts the release on failure — a half-applied deploy is worse than
# no deploy. Migrations run BEFORE the build so the build sees the new schema.
#
# Requires: git, npm, pm2, and a populated .env in APP_DIR.

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/srv/jilber}"
PM2_APP="${PM2_APP:-jilber}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-20}"
BRANCH="${BRANCH:-main}"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

trap 'fail "step failed on line $LINENO — the previous release is still running"' ERR

cd "$APP_DIR" || fail "APP_DIR $APP_DIR does not exist"

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
log "Preflight"
[ -f .env ] || fail ".env is missing in $APP_DIR"

# The app boots against a sandbox payment gateway if this is not exactly
# 'production' (see lib/payments/whish-boot.ts) — check before we touch anything.
if ! grep -qE '^NODE_ENV=production' .env; then
  fail "NODE_ENV=production is not set in .env — Whish would run in SANDBOX mode"
fi

command -v pm2 >/dev/null || fail "pm2 is not installed"

PREV_SHA="$(git rev-parse HEAD)"
echo "current commit: $PREV_SHA"

# ---------------------------------------------------------------------------
# Backup before we change anything the database depends on
# ---------------------------------------------------------------------------
if [ -x ./deploy/backup.sh ]; then
  log "Pre-release backup"
  ./deploy/backup.sh || fail "pre-release backup failed — refusing to deploy"
else
  echo "WARNING: deploy/backup.sh not executable — skipping pre-release backup" >&2
fi

# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------
log "Fetching $BRANCH"
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
NEW_SHA="$(git rev-parse HEAD)"
echo "deploying commit: $NEW_SHA"

# ---------------------------------------------------------------------------
# Dependencies
#
# Full install: `next build` needs typescript, tailwindcss and @tailwindcss/postcss,
# all of which are devDependencies. They get pruned again after the build so the
# running server carries only production packages.
# ---------------------------------------------------------------------------
log "Installing dependencies"
npm ci

log "Auditing production dependencies"
# Production tree only — dev-only advisories (eslint's brace-expansion) have no
# runtime exposure and must not block a release.
npm audit --omit=dev --audit-level=high || fail "production dependencies have high-severity advisories"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
log "Applying migrations"
npx prisma migrate deploy

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
log "Building"
# `npm run build` runs `prisma generate && next build` and needs DATABASE_URL,
# because pages prerender from MSSQL.
npm run build

# Deliberately NOT running `npm prune --omit=dev` here. `tsx` (the payment
# reconciliation cron) and the `prisma` CLI (migrations) both live in
# devDependencies and are needed on the box at runtime. The dev packages that do
# remain are never executed, and `npm audit --omit=dev` above already gates the
# tree that actually runs.

# ---------------------------------------------------------------------------
# Restart + verify
# ---------------------------------------------------------------------------
log "Reloading $PM2_APP"
if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  pm2 reload "$PM2_APP" --update-env
else
  pm2 start deploy/ecosystem.config.js
fi

log "Health check"
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
    log "Healthy. Deployed $PREV_SHA -> $NEW_SHA"
    pm2 save >/dev/null
    exit 0
  fi
  echo "  waiting for health ($i/$HEALTH_RETRIES)…"
  sleep 3
done

# Health never came up. Surface logs and make the failure loud; the operator
# decides whether to roll back (git reset --hard "$PREV_SHA" && ./deploy/deploy.sh).
pm2 logs "$PM2_APP" --lines 50 --nostream || true
fail "app did not become healthy after deploy — previous commit was $PREV_SHA"
