#!/usr/bin/env bash
#
# Local watchdog. Verifies the store answers over its PUBLIC URL and alerts
# Telegram when that state changes. Also warns before the TLS certificate
# expires.
#
#   sudo install -m 755 deploy/watchdog.sh /usr/local/bin/jilber-watchdog
#   sudo crontab -e     # */5 * * * * /usr/local/bin/jilber-watchdog
#
# Runs as root: it needs /etc/letsencrypt (root-only) and /srv/jilber/.env
# (0600 jilber) to read ERROR_WEBHOOK_URL.
#
# WHAT THIS DOES AND DOES NOT COVER
# It runs ON the server, so it cannot detect the server being dead — that is
# what an external uptime monitor is for, and it is not optional. What it does
# catch, which nothing else on this box does:
#   * nginx down or misconfigured (systemd only restarts it on *failure*, not
#     on a config-level outage where the process is alive but wrong)
#   * the app up but the database unreachable (/api/health returns 503)
#   * TLS broken, or a certificate renewal that silently stopped working —
#     certbot.timer failing produces no alert of its own
#
# Alerts fire only on STATE CHANGE, so a long outage does not send a message
# every five minutes.

set -uo pipefail

URL="${WATCHDOG_URL:-https://protuningshop.com/api/health}"
STATE_DIR="${WATCHDOG_STATE_DIR:-/var/lib/jilber}"
STATE="$STATE_DIR/watchdog.state"
CERT_STATE="$STATE_DIR/watchdog.cert.state"
CERT="${WATCHDOG_CERT:-/etc/letsencrypt/live/protuningshop.com/cert.pem}"
CERT_WARN_DAYS="${CERT_WARN_DAYS:-10}"
ENV_FILE="${ENV_FILE:-/srv/jilber/.env}"

mkdir -p "$STATE_DIR" 2>/dev/null

# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }

# node is a hard dependency of this application, so it is always present, and it
# escapes JSON correctly without pulling in jq.
json() { node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1"; }

notify() {
  local text="$1" base chat
  [ -n "${ERROR_WEBHOOK_URL:-}" ] || { echo "watchdog: ERROR_WEBHOOK_URL unset"; return 0; }
  base="${ERROR_WEBHOOK_URL%%\?*}"
  chat="$(printf '%s' "$ERROR_WEBHOOK_URL" | sed -n 's/.*[?&]chat_id=\([^&]*\).*/\1/p')"
  [ -n "$chat" ] || { echo "watchdog: no chat_id in ERROR_WEBHOOK_URL"; return 0; }
  curl -s -o /dev/null --max-time 20 -X POST "$base" \
    -H 'Content-Type: application/json' \
    --data "{\"chat_id\":\"$chat\",\"text\":$(json "$text"),\"disable_web_page_preview\":true}"
}

# ---------------------------------------------------------------------------
# Public reachability
# ---------------------------------------------------------------------------
body_file="$(mktemp)"
code="$(curl -s -o "$body_file" -w '%{http_code}' --max-time 25 "$URL" 2>/dev/null || echo 000)"
body="$(head -c 300 "$body_file" 2>/dev/null)"
mv -f "$body_file" "$STATE_DIR/watchdog.lastbody" 2>/dev/null

now="down"; [ "$code" = "200" ] && now="up"
prev="$(cat "$STATE" 2>/dev/null || echo up)"

if [ "$now" != "$prev" ]; then
  if [ "$now" = "down" ]; then
    notify "$(printf 'STORE DOWN\n%s\nHTTP %s\n%s' "$URL" "$code" "$body")"
  else
    notify "$(printf 'STORE RECOVERED\n%s is answering 200 again' "$URL")"
  fi
  printf '%s' "$now" > "$STATE"
fi

# ---------------------------------------------------------------------------
# TLS expiry. certbot.timer renews automatically, but a timer that starts
# failing is silent — and an expired certificate takes the whole site down for
# every visitor at once.
# ---------------------------------------------------------------------------
if [ -r "$CERT" ]; then
  end="$(openssl x509 -enddate -noout -in "$CERT" 2>/dev/null | cut -d= -f2)"
  if [ -n "$end" ]; then
    days=$(( ( $(date -d "$end" +%s) - $(date +%s) ) / 86400 ))
    if [ "$days" -lt "$CERT_WARN_DAYS" ]; then
      today="$(date -u +%F)"
      if [ "$(cat "$CERT_STATE" 2>/dev/null)" != "$today" ]; then
        notify "$(printf 'TLS CERT EXPIRING\n%s\n%s days remaining (expires %s)\nCheck: systemctl status certbot.timer' "$CERT" "$days" "$end")"
        printf '%s' "$today" > "$CERT_STATE"
      fi
    fi
  fi
fi

[ "$now" = "up" ] || exit 1
