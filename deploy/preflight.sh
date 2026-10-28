#!/usr/bin/env bash
#
# PRE-LAUNCH PREFLIGHT — run this on the VPS before taking real payments.
#
#   cd /srv/jilber && ./deploy/preflight.sh
#   ./deploy/preflight.sh https://yourdomain.com    # also checks the live site
#
# Every check here corresponds to a specific way this application has been able
# to fail silently. It is deliberately noisy about *why* each one matters, so a
# failure tells you what to do rather than just that something is wrong.
#
# Exit code 0 = safe to launch. Non-zero = at least one FAIL.
# WARNs do not block, but read them.

set -uo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
PUBLIC_URL="${1:-}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"

PASS=0; FAIL=0; WARN=0

ok()   { printf '  \033[1;32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[1;31mFAIL\033[0m  %s\n' "$1"; printf '        → %s\n' "$2"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[1;33mWARN\033[0m  %s\n' "$1"; printf '        → %s\n' "$2"; WARN=$((WARN+1)); }
# Deliberately NOT named `head` — that would shadow the `head` COMMAND used
# inside envval(), silently turning every .env lookup into a heading print.
section() { printf '\n\033[1;36m%s\033[0m\n' "$1"; }

cd "$APP_DIR" || { echo "APP_DIR $APP_DIR not found"; exit 2; }

# Read .env without exporting it into the checks' own environment by accident.
envval() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'; }

# ---------------------------------------------------------------------------
section "1. Runtime"
# ---------------------------------------------------------------------------
if [ -f .nvmrc ]; then
  want="$(tr -d '[:space:]' < .nvmrc)"
  have="$(node -v 2>/dev/null | sed 's/^v//')"
  if [ "$have" = "$want" ]; then
    ok "Node $have matches .nvmrc"
  else
    want_major="${want%%.*}"; have_major="${have%%.*}"
    if [ "$have_major" = "$want_major" ]; then
      # 20.19 is the floor for Prisma 7 / vitest 4, so a same-major mismatch
      # can still be fatal.
      minor="${have#*.}"; minor="${minor%%.*}"
      if [ "$have_major" = "20" ] && [ "$minor" -lt 19 ]; then
        bad "Node $have is below 20.19"             "Prisma 7 will not install and vitest 4 will not run. Install $want."
      else
        warn "Node $have, .nvmrc wants $want" "Same major, but pin them to match."
      fi
    else
      bad "Node $have but .nvmrc wants $want" \
          "Node 20 reached EOL in April 2026 — no security patches. Install $want."
    fi
  fi
else
  warn ".nvmrc missing" "Pin the Node version so dev, CI and prod agree."
fi

# ---------------------------------------------------------------------------
section "2. Environment"
# ---------------------------------------------------------------------------
if [ -f .env ]; then
  ok ".env present"
  perms="$(stat -c '%a' .env 2>/dev/null || echo '?')"
  if [ "$perms" = "600" ]; then
    ok ".env is chmod 600"
  else
    bad ".env is chmod $perms" "Contains DB and payment credentials. Run: chmod 600 .env"
  fi
else
  bad ".env missing" "Copy .env.example and fill it in."
fi

if [ "$(envval NODE_ENV)" = "production" ]; then
  ok "NODE_ENV=production"
else
  bad "NODE_ENV is not 'production'" \
      "whish-pay picks its API host from NODE_ENV alone. Without this the store runs against the SANDBOX: checkout appears to succeed and NO MONEY IS COLLECTED."
fi

secret="$(envval AUTH_SECRET)"
if [ -z "$secret" ]; then
  bad "AUTH_SECRET is unset" "The app will refuse to boot."
elif [ "${#secret}" -lt 32 ]; then
  bad "AUTH_SECRET is ${#secret} chars" "Must be at least 32. The app will refuse to boot."
elif [ "$secret" = "your-secret-key-here-minimum-32-chars" ]; then
  bad "AUTH_SECRET is still the .env.example placeholder" \
      "Anyone with the repo can forge session cookies. Generate a fresh one."
else
  ok "AUTH_SECRET is set and long enough"
fi

site_url="$(envval NEXT_PUBLIC_SITE_URL)"
case "$site_url" in
  https://*) ok "NEXT_PUBLIC_SITE_URL is https" ;;
  "")        bad "NEXT_PUBLIC_SITE_URL is unset" "Whish callback and email links will be wrong." ;;
  *)         bad "NEXT_PUBLIC_SITE_URL is not https ($site_url)" \
                 "Whish callbacks and password-reset links are built from this." ;;
esac
case "$site_url" in
  */) bad "NEXT_PUBLIC_SITE_URL has a trailing slash" "Produces doubled slashes in callback URLs." ;;
esac

if [ -n "$(envval WHISH_CHANNEL)" ] && [ -n "$(envval WHISH_SECRET)" ]; then
  ok "Whish credentials are set"
  if [ -n "$(envval WHISH_ALLOW_SANDBOX)" ]; then
    bad "WHISH_ALLOW_SANDBOX is set" "Payments will NOT collect real money. Unset it for launch."
  fi
else
  warn "Whish credentials not set" "Card checkout will return 503; only shop/bank payment will work."
fi

[ -n "$(envval RESEND_API_KEY)" ] && ok "Email (Resend) configured" \
  || bad "RESEND_API_KEY unset" "Order confirmations, password resets and verification emails are silently no-ops."

[ -n "$(envval ADMIN_EMAIL)" ] && ok "ADMIN_EMAIL set" \
  || warn "ADMIN_EMAIL unset" "You will not be alerted about new orders or quotes."

tp="$(envval TRUSTED_PROXY_COUNT)"
if [ -z "$tp" ]; then
  warn "TRUSTED_PROXY_COUNT unset (defaults to 1)" "Correct for the bundled nginx. Set it explicitly if your chain differs."
else
  ok "TRUSTED_PROXY_COUNT=$tp"
fi

if [ -n "$(envval ADMIN_BOOTSTRAP_PASSWORD)" ]; then
  warn "ADMIN_BOOTSTRAP_PASSWORD is still in .env" "Unset it once the first admin exists."
fi

# ---------------------------------------------------------------------------
section "3. Database"
# ---------------------------------------------------------------------------
# `prisma migrate status` exits non-zero for BOTH "cannot connect" and "there are
# pending migrations", so inspect the output rather than trusting the exit code —
# otherwise a pending migration is misreported as a dead database.
npx --no-install prisma migrate status > /tmp/_migstatus 2>&1
if grep -qiE "database schema is up to date|no pending migrations" /tmp/_migstatus; then
  ok "All migrations applied"
elif grep -qiE "have not yet been applied|pending migration|following migration" /tmp/_migstatus; then
  bad "Pending migrations" "Run: npx prisma migrate deploy"
elif grep -qiE "P1000|P1001|P1002|can't reach|could not connect|login failed" /tmp/_migstatus; then
  bad "Cannot reach the database" "Check DATABASE_URL and that MSSQL is running."
else
  warn "Could not determine migration status" "$(tail -2 /tmp/_migstatus | tr '\n' ' ')"
fi
rm -f /tmp/_migstatus

if command -v ss >/dev/null 2>&1; then
  if ss -ltn 2>/dev/null | grep -qE '(^|\s)(0\.0\.0\.0|\[::\]):1433'; then
    bad "MSSQL is listening on all interfaces (:1433)" \
        "Bind it to localhost or a private network, and firewall 1433."
  else
    ok "MSSQL is not bound to a public interface"
  fi
fi

# ---------------------------------------------------------------------------
section "4. Uploads"
# ---------------------------------------------------------------------------
upload_dir="$(envval UPLOAD_DIR)"
if [ -z "$upload_dir" ]; then
  bad "UPLOAD_DIR unset" \
      "Uploads would land in public/ and be WIPED by the next deploy. Point it at a persistent path."
elif [ -d "$upload_dir" ] && [ -w "$upload_dir" ]; then
  ok "UPLOAD_DIR exists and is writable ($upload_dir)"
else
  bad "UPLOAD_DIR $upload_dir missing or not writable" "mkdir -p it and chown to the app user."
fi

# ---------------------------------------------------------------------------
section "5. Backups"
# ---------------------------------------------------------------------------
backup_dir="$(envval BACKUP_DIR)"; backup_dir="${backup_dir:-/var/backups/jilber}"
if [ -d "$backup_dir" ]; then
  newest="$(find "$backup_dir" -name '*.bak' -mtime -2 2>/dev/null | head -1)"
  if [ -n "$newest" ]; then
    ok "A database backup from the last 48h exists"
  else
    bad "No backup newer than 48h in $backup_dir" "Run ./deploy/backup.sh and schedule it (deploy/crontab.example)."
  fi
else
  bad "$backup_dir does not exist" "Run ./deploy/backup.sh and schedule it."
fi

[ -n "$(envval OFFSITE_DEST)" ] && ok "OFFSITE_DEST configured" \
  || bad "OFFSITE_DEST unset" "Backups exist only on the box they are meant to protect."

if [ -f "$backup_dir/.restore-drill-passed" ]; then
  ok "Restore drill recorded ($(cat "$backup_dir/.restore-drill-passed"))"
else
  bad "No restore drill on record" \
      "An untested backup is not a backup. Run ./deploy/restore-drill.sh <backup>, then: date > $backup_dir/.restore-drill-passed"
fi

# ---------------------------------------------------------------------------
section "6. Process"
# ---------------------------------------------------------------------------
if command -v pm2 >/dev/null 2>&1; then
  # Parse the JSON rather than grepping it. `pm2 jlist` emits "name":"jilber"
  # TWICE per app — once at the top level and once nested inside pm2_env — so
  # a grep -c counts double, reports 2 for a single healthy process, and makes
  # this check impossible to pass.
  instances="$(pm2 jlist 2>/dev/null | node -e '
    let s = "";
    process.stdin.on("data", d => s += d).on("end", () => {
      try { console.log(JSON.parse(s).filter(p => p && p.name === "jilber").length); }
      catch { console.log("-1"); }
    });
  ' 2>/dev/null)"
  [ -n "$instances" ] || instances=-1

  if [ "$instances" = "-1" ]; then
    warn "Could not read the pm2 process list" "Check: pm2 jlist"
  elif [ "$instances" -eq 1 ]; then
    ok "pm2 is running exactly one 'jilber' instance"
  elif [ "$instances" -eq 0 ]; then
    warn "pm2 has no 'jilber' process" "Start it: pm2 start deploy/ecosystem.config.js"
  else
    bad "pm2 is running $instances 'jilber' instances" \
        "lib/rate-limit.ts and lib/login-throttle.ts hold per-process state — every extra worker multiplies the effective limits."
  fi
else
  warn "pm2 not found" "The bundled ecosystem.config.js assumes pm2."
fi

if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
  ok "Health endpoint responds"
else
  bad "Health endpoint not responding at $HEALTH_URL" "The app is down or not listening on :3000."
fi

# ---------------------------------------------------------------------------
section "7. Scheduled jobs"
# ---------------------------------------------------------------------------
crons="$(crontab -l 2>/dev/null)"
echo "$crons" | grep -q "reconcile:payments" \
  && ok "Payment reconciliation is scheduled" \
  || bad "Payment reconciliation is NOT scheduled" \
         "A dropped Whish callback means the customer was charged and the order stays unpaid forever, with no alert. See deploy/crontab.example."
echo "$crons" | grep -q "backup.sh" \
  && ok "Backup is scheduled" \
  || bad "Backup is NOT scheduled" "See deploy/crontab.example."

# ---------------------------------------------------------------------------
if [ -n "$PUBLIC_URL" ]; then
section "8. Live site ($PUBLIC_URL)"
  hdrs="$(curl -fsS -D - -o /dev/null --max-time 10 "$PUBLIC_URL" 2>/dev/null)"
  if [ -z "$hdrs" ]; then
    bad "Could not reach $PUBLIC_URL" "Check DNS, nginx and TLS."
  else
    ok "Site reachable over HTTPS"
    check_hdr() {
      echo "$hdrs" | grep -qi "^$1:" && ok "$1 present" || bad "$1 missing" "$2"
    }
    check_hdr "content-security-policy" "Set in next.config.ts — is nginx stripping it?"
    check_hdr "strict-transport-security" "HSTS only applies over HTTPS."
    check_hdr "x-content-type-options" "Set in next.config.ts."
    check_hdr "x-frame-options" "Set in next.config.ts."
    echo "$hdrs" | grep -qi "^x-powered-by:" \
      && bad "X-Powered-By is exposed" "poweredByHeader:false is set — is something else adding it?" \
      || ok "X-Powered-By not exposed"
  fi

  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$PUBLIC_URL/api/admin/orders" 2>/dev/null)"
  [ "$code" = "401" ] || [ "$code" = "403" ] \
    && ok "Admin API rejects unauthenticated requests ($code)" \
    || bad "Admin API returned $code without a session" "Expected 401/403."
fi

# ---------------------------------------------------------------------------
printf '\n\033[1m──────────────────────────────────────────\033[0m\n'
printf '  \033[1;32m%d passed\033[0m   \033[1;33m%d warnings\033[0m   \033[1;31m%d failed\033[0m\n' "$PASS" "$WARN" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
  printf '\n\033[1;31mNOT READY.\033[0m Resolve the failures above before taking real payments.\n\n'
  exit 1
fi
printf '\n\033[1;32mAll automated checks passed.\033[0m\n'
printf 'Still requires a human: the sandbox payment rehearsal (including a\n'
printf 'deliberately dropped callback) — see docs/PRE-LAUNCH.md.\n\n'
