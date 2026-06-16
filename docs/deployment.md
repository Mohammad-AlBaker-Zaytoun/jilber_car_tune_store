# Deployment Runbook — VPS

How to deploy the JILBER store to a self-managed VPS (Ubuntu/Debian assumed). The
app is a long-lived `next start` Node process behind nginx. This is **not** a
serverless deploy — that distinction matters for rate limiting and uploads (below).

Addresses the infra gaps I-1…I-9 from `docs/TASKS_2.md`.

---

## 1. Prerequisites

- **Node.js ≥ 20.19** (LTS). `node -v` to confirm.
- **MSSQL** reachable from the app host (local instance or private network).
- A domain pointing at the VPS, ports **80/443** reachable.
- A non-root deploy user that owns the app directory.

---

## 2. Environment (`.env`)

Copy `.env.example` → `.env` on the server and fill in. **`chmod 600 .env`**, owned
by the app user. Required:

| Key | Notes |
|-----|-------|
| `DATABASE_URL` | MSSQL connection string. For a private/local DB keep `encrypt=true`. |
| `AUTH_SECRET` | **Fresh** 32+ char random value (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Never the `.env.example` placeholder. |
| `NODE_ENV=production` | Makes the session cookie `secure` and selects the Whish **production** API. |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com`, no trailing slash. Used for canonical URLs, email links, and Whish callback/redirect URLs. |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | Email (order/quote/reset/verify). Unset = mail is a logged no-op. |
| `WHISH_CHANNEL`, `WHISH_SECRET` | Card payments. Unset = "Card" checkout returns 503. |
| `UPLOAD_DIR` | Absolute **persistent** path, e.g. `/var/lib/jilber/uploads` (see §5). |
| `UPLOAD_PUBLIC_PATH` | URL prefix nginx serves uploads from, e.g. `/products/uploads`. |

---

## 3. Build & run (I-1)

```bash
npm ci
npx prisma generate
npm run build            # prisma generate + next build (needs DATABASE_URL)
```

Run under **PM2 in fork mode** — the in-memory rate limiter (`lib/rate-limit.ts`)
holds per-process state, so cluster mode / multiple workers would multiply the
effective limits. Pin to a single instance:

`ecosystem.config.js`:
```js
module.exports = {
  apps: [{
    name: 'jilber',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    exec_mode: 'fork',
    instances: 1,
    env: { NODE_ENV: 'production' },
  }],
};
```
```bash
pm2 start ecosystem.config.js
pm2 save && pm2 startup    # restart on reboot
```

_Alternative:_ a `systemd` unit running `npm run start` with `Restart=always` and
`EnvironmentFile=/path/.env` works equally well — just keep it a single process.

---

## 4. Reverse proxy + TLS (I-2)

nginx terminates HTTPS and proxies to `127.0.0.1:3000`:

```nginx
server {
  server_name yourdomain.com;

  client_max_body_size 6m;            # > the 5 MB image-upload limit

  # Serve uploaded product images straight from disk (see §5)
  location /products/uploads/ {
    alias /var/lib/jilber/uploads/;
    access_log off;
    expires 30d;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    # Overwrite (do NOT append) XFF so the app's rate limiter can't be spoofed (I-4/P1-4)
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo certbot --nginx -d yourdomain.com   # provisions + auto-renews TLS
```
HSTS and the other security headers ship from `next.config.ts`; HSTS only takes
effect once TLS is live.

---

## 5. Persistent uploads (I-3 / P0-3)

`next start` won't serve files added to `public/` after build, and a redeploy that
replaces the app dir would wipe them. So write uploads outside the build output and
serve them from nginx:

```bash
sudo mkdir -p /var/lib/jilber/uploads
sudo chown <app-user> /var/lib/jilber/uploads
```
Set `UPLOAD_DIR=/var/lib/jilber/uploads` and `UPLOAD_PUBLIC_PATH=/products/uploads`
in `.env`; the nginx `location` in §4 serves them.

---

## 6. Firewall (I-4)

```bash
sudo ufw allow 80,443/tcp
sudo ufw allow <ssh-port>/tcp     # key-only auth recommended
sudo ufw enable
```
**MSSQL (1433) must NOT be publicly reachable** — bind it to localhost or a private
network/security group only.

---

## 7. Database: migrations, admin, backups

```bash
npx prisma migrate deploy         # applies all pending migrations, e.g.:
# 20260616000000_add_password_reset_tokens
# 20260616120000_add_status_indexes
# 20260616130000_add_token_version_and_email_verification
# 20260616140000_add_whish_payment_fields
# 20260616140001_add_whish_external_id_index
```
Run `prisma migrate deploy` **on every release**, before restarting the process.

First deploy only — create the admin (no admin exists on a fresh DB):
```bash
ADMIN_BOOTSTRAP_EMAIL=you@example.com \
ADMIN_BOOTSTRAP_PASSWORD='a-strong-password' \
npm run db:seed:admin
```

**Backups (I-6):** schedule a daily MSSQL backup and **test a restore**. Example
(SQL Server Agent or cron + `sqlcmd`): `BACKUP DATABASE [jilber] TO DISK=...` then
copy off-box. No backup story ships in the repo — own this.

---

## 8. Observability (I-8)

- Point an uptime monitor / load-balancer probe at **`GET /api/health`** (returns
  200 with a DB ping, 503 if the DB is down).
- PM2 captures stdout/stderr; add rotation: `pm2 install pm2-logrotate`.
- (Optional, recommended) wire an error tracker — see P2-2 in `docs/TASKS_2.md`.

---

## 9. Edge abuse protection (I-9)

No platform firewall here. Add defense-in-depth in front of the app's own limiter:
- nginx `limit_req_zone` / `limit_req` on `/api/auth/*` and `/api/orders`.
- `fail2ban` on nginx logs to ban repeat offenders.

---

## 10. Payment callback note (Whish)

Whish calls `GET /api/whish/callback` (cross-origin). The proxy CSRF gate only
blocks non-safe methods, so GET passes — no extra config. Ensure
`NEXT_PUBLIC_SITE_URL` is the public HTTPS URL so the callback/redirect URLs Whish
receives are correct. Use **sandbox** Whish keys with `NODE_ENV` non-production to
test end-to-end before going live.

---

## Release checklist (every deploy)

1. `git pull`
2. `npm ci`
3. `npx prisma migrate deploy`
4. `npm run build`
5. `pm2 reload jilber` (zero-downtime within the single process) or `pm2 restart jilber`
6. Smoke: `curl -fsS https://yourdomain.com/api/health`
