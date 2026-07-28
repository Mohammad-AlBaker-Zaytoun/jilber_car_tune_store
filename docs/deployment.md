# Deployment Runbook — VPS

How to deploy the JILBER store to a self-managed VPS (Ubuntu/Debian assumed). The
app is a long-lived `next start` Node process behind nginx. This is **not** a
serverless deploy — that distinction matters for rate limiting and uploads (below).

Addresses the infra gaps I-1…I-9 from `docs/TASKS_2.md`.

---

## 1. Prerequisites

- **Node.js — use the version pinned in `.nvmrc` (24.x LTS "Krypton").**
  Node 20 reached **end-of-life in April 2026** and receives no further security
  patches; do not deploy onto it. `node -v` to confirm.
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
| `TRUSTED_PROXY_COUNT` | Proxies in front of the app. **1** with `deploy/nginx.conf`. Too high = clients can forge their IP and bypass all rate limits. |
| `DB_USER`, `DB_PASS`, `BACKUP_DIR`, `OFFSITE_DEST` | Used by `deploy/backup.sh` (§7). |

Node: use the version in `.nvmrc`. **Node 20 reached end-of-life in April 2026** —
it no longer receives security patches, so do not deploy onto it.

---

## 3. Build & run (I-1)

```bash
npm ci
npx prisma generate
npm run build            # prisma generate + next build (needs DATABASE_URL)
```

Run under **PM2 in fork mode** — the in-memory rate limiter (`lib/rate-limit.ts`)
holds per-process state, so cluster mode / multiple workers would multiply the
effective limits. The config is committed at **`deploy/ecosystem.config.js`**:

```bash
pm2 start deploy/ecosystem.config.js
pm2 save && pm2 startup    # restart on reboot
```

> **Do not raise `instances` above 1** without first moving the rate limiter to a
> shared store. This is a correctness constraint, not a tuning preference.

_Alternative:_ a `systemd` unit running `npm run start` with `Restart=always` and
`EnvironmentFile=/path/.env` works equally well — just keep it a single process.

---

## 4. Reverse proxy + TLS (I-2)

nginx terminates HTTPS and proxies to `127.0.0.1:3000`. Both files are committed —
**`deploy/nginx.conf`** (site) and **`deploy/proxy_params_jilber`** (shared headers):

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/jilber
sudo cp deploy/proxy_params_jilber /etc/nginx/proxy_params_jilber
sudo ln -s /etc/nginx/sites-available/jilber /etc/nginx/sites-enabled/
# edit yourdomain.com in the site file, then:
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com   # provisions + auto-renews TLS
```

The config covers: the 6 MB body limit (> the 5 MB upload cap), serving
`UPLOAD_DIR` from disk, `immutable` caching for `_next/static` and the ~50 MB of
frame sequences, and `limit_req` zones on `/api/auth/` and `/api/`.

**The `X-Forwarded-For` line is security-critical.** `proxy_params_jilber` sets it
to `$remote_addr` — overwrite, not append — so a client cannot forge its own IP.
`lib/rate-limit.ts` reads the Nth entry from the *right* (`TRUSTED_PROXY_COUNT`,
default 1), which is correct whether the proxy overwrites or appends. Reading the
leftmost entry, as it used to, let anyone bypass every rate limit in the app.

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
npx prisma migrate deploy    # applies every pending migration in prisma/migrations/
```

`deploy/deploy.sh` runs this on every release, before the build. (There used to be
a hand-maintained migration list here; it drifted out of date twice, so the
directory is now the only source of truth.)

First deploy only — create the admin (no admin exists on a fresh DB):

```bash
ADMIN_BOOTSTRAP_EMAIL=you@example.com \
ADMIN_BOOTSTRAP_PASSWORD='a-strong-password' \
npm run db:seed:admin
```

> **Never run `npm run db:seed` against production.** That seeder overwrites every
> product field (reverting admin price edits), resets Settings, and hard-deletes
> orders. It now refuses to run when `NODE_ENV=production` or when `DATABASE_URL`
> points at a non-local host, but do not rely on the guard — use `db:seed:admin`.

### Backups (I-6) — `deploy/backup.sh`

```bash
sudo mkdir -p /var/backups/jilber /var/log/jilber
./deploy/backup.sh          # DB dump + uploads tarball + off-box copy
```

Backs up **both** the database and `UPLOAD_DIR` — the DB stores image *paths*, so
restoring one without the other gives a catalogue of broken images. It runs
`RESTORE VERIFYONLY` before counting a dump as good, and prunes past
`RETENTION_DAYS` (default 14). Set `OFFSITE_DEST` or the backups only exist on the
box they are meant to protect.

### Restore drill — `deploy/restore-drill.sh` (this is what makes it a backup)

```bash
./deploy/restore-drill.sh /var/backups/jilber/jilber-YYYYMMDD-HHMMSS.bak
```

Restores into a scratch database, checks row counts and `_prisma_migrations`, then
drops it. It refuses to touch `DB_NAME`. **Run this before go-live and record the
date below.**

| Last verified restore | Verified by |
|---|---|
| _not yet run — do this before launch_ | |

Both are scheduled in `deploy/crontab.example` (nightly backup, monthly drill).

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

Whish calls `/api/whish/callback` both server-to-server and as a browser redirect.
The route handles them separately: `POST` returns a plain `200` (a 3xx on a
server-to-server callback is treated as failed delivery by many gateways, and it
used to return `307`), while `GET` settles the payment and then redirects the
customer. Cross-origin `GET` passes the proxy CSRF gate, which only blocks
non-safe methods — no extra config needed.

Ensure `NEXT_PUBLIC_SITE_URL` is the public HTTPS URL so the callback and redirect
URLs Whish receives are correct.

### The sandbox trap

`whish-pay` picks its API host from `NODE_ENV` alone:

| `NODE_ENV` | Whish host | Money moves? |
|---|---|---|
| `production` | `lb.whish.money` | yes |
| anything else | `lb.sandbox.whish.money` | **no** |

A deploy that forgets `NODE_ENV=production` therefore takes orders that *look*
successful while collecting nothing. The app now **refuses to boot** in that state
(`lib/payments/whish-boot.ts`), and `deploy/deploy.sh` checks `.env` before
touching anything. To test against sandbox on purpose, set `WHISH_ALLOW_SANDBOX=1`.

### Payment reconciliation (required)

The success callback is the only path that marks a card order paid. A dropped
callback means the customer was charged and the order stays `unpaid` forever —
no confirmation email, no alert. `scripts/reconcile-payments.ts` re-queries Whish
for unconfirmed orders and settles them; schedule it every 15 minutes from
`deploy/crontab.example`:

```bash
npm run reconcile:payments -- --dry-run   # see what it would do
```

---

## Release checklist (every deploy)

Run **`./deploy/deploy.sh`**. It performs the whole sequence and aborts on any
failure rather than leaving a half-applied release:

1. Preflight — `.env` present, `NODE_ENV=production` (the sandbox trap above)
2. Pre-release backup via `deploy/backup.sh`
3. `git fetch` + hard reset to `origin/main`
4. `npm ci`, then `npm audit --omit=dev --audit-level=high`
5. `npx prisma migrate deploy`
6. `npm run build`
7. `pm2 reload jilber`
8. Poll `GET /api/health` until healthy; dump PM2 logs and fail loudly if not

Rollback: `git reset --hard <previous-sha> && ./deploy/deploy.sh` (the script
prints the previous SHA at the start of every run).
