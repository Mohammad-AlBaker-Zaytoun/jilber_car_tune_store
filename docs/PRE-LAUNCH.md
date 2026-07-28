# Pre-Launch Checklist

Work through this on the VPS before the store takes its first real payment.

Most of it is automated — run **`./deploy/preflight.sh https://yourdomain.com`**
and fix every FAIL. This document covers the parts a script cannot check: the
things that need a human to actually watch money move.

---

## 1. Automated preflight

```bash
cd /srv/jilber
./deploy/preflight.sh https://yourdomain.com
```

Exit code 0 means every mechanical check passed: Node version, `.env`
permissions and contents, `NODE_ENV`, `AUTH_SECRET` strength, migrations
applied, MSSQL not publicly bound, upload directory writable, a recent backup, a
recorded restore drill, a single PM2 instance, the health endpoint, the cron
jobs, and the live security headers.

Do not proceed while anything is FAIL.

---

## 2. Rotate every credential  ⚠️

Nothing from development or `.env.example` may survive into production.

- [ ] `AUTH_SECRET` — fresh 32+ byte value.
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      *(Changing this signs everyone out — do it before launch, not after.)*
- [ ] `WHISH_CHANNEL` / `WHISH_SECRET` — **production** credentials from Whish.
- [ ] `RESEND_API_KEY` — production key, from a verified sending domain.
- [ ] MSSQL password for the application user.
- [ ] Unset `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` once the first
      admin exists.
- [ ] Confirm `WHISH_ALLOW_SANDBOX` is **not** set.

---

## 3. Payment rehearsal  ⚠️ the one that matters

Do this with **sandbox** Whish keys and `WHISH_ALLOW_SANDBOX=1`, on the real
VPS behind the real domain — not on a laptop.

- [ ] **Happy path.** Add a product to the cart, check out with Card, complete
      payment on the Whish page.
  - [ ] The tax shown on `/checkout` matches what Whish charged.
  - [ ] You land on `/checkout/success` with a real order reference.
  - [ ] **The cart is empty afterwards.** (A full cart here means a customer can
        pay twice.)
  - [ ] The order shows `paid` in `/admin/orders`.
  - [ ] The customer confirmation email arrives, and the admin alert arrives.

- [ ] **Dropped callback — the failure mode that loses money silently.**
      Block the callback so Whish cannot reach it (temporarily deny
      `/api/whish/callback` in nginx), then pay again.
  - [ ] The order sits `unpaid` immediately after payment.
  - [ ] Restore the callback route, then run:
        `npm run reconcile:payments -- --older-than-minutes=0`
  - [ ] It logs `RECOVERED <ref>` and the order flips to `paid`.
  - [ ] The confirmation email arrives exactly **once** — not twice.

- [ ] **Failed payment.** Cancel on the Whish page → you land on
      `/checkout/failure` and the order is not marked paid.

- [ ] **Non-card path.** Place a "Pay at Workshop" order → confirmation email
      sends immediately and the order is `pending` / `unpaid`.

Then switch to production keys, unset `WHISH_ALLOW_SANDBOX`, restart, and place
**one real low-value order with a real card**. Confirm the money actually
arrives in the Whish account. Refund it afterwards.

---

## 4. Backup and restore

- [ ] `./deploy/backup.sh` completes and writes both a `.bak` and an uploads
      tarball.
- [ ] The backup is copied off-box (`OFFSITE_DEST`).
- [ ] `./deploy/restore-drill.sh /var/backups/jilber/<newest>.bak` passes.
- [ ] Record it so preflight can see it:
      `date > /var/backups/jilber/.restore-drill-passed`
- [ ] Fill in the "Last verified restore" row in `docs/deployment.md`.

---

## 5. Operational readiness

- [ ] Cron installed from `deploy/crontab.example`, and `MAILTO` points at an
      inbox someone reads.
- [ ] `ERROR_WEBHOOK_URL` set to a Slack/Discord webhook (or an SDK wired into
      `lib/observability.ts`). Without it, errors are structured JSON in PM2 logs
      only — you have to go looking.
- [ ] `pm2 install pm2-logrotate` so logs don't fill the disk.
- [ ] `pm2 save && pm2 startup` so the app survives a reboot.
- [ ] Uptime monitor pointed at `GET /api/health`.
- [ ] Deliberately break something (stop MSSQL) and confirm you actually find
      out — health check fails, alert fires.

---

## 6. Content and legal

- [ ] Products, prices and stock flags are correct in `/admin/products`.
- [ ] Tax rate in `/admin/settings` is correct. **Changing it changes what
      customers are charged.**
- [ ] Contact details, WhatsApp number and opening hours are real.
- [ ] Privacy policy, terms and cookie policy reviewed — they ship as templates.
- [ ] `public/og/default-og.jpg` is the real brand image.
- [ ] Place a test order and confirm the confirmation email reads correctly with
      real branding and a working reply-to address.

---

## 7. Known limitations to acknowledge before selling

These are deliberate, documented decisions — not oversights. The buyer should
know about them.

| Limitation | Impact |
|---|---|
| **No stock quantities.** Only an `inStock` on/off flag. | Fine for a service/booking model. If the business starts shipping parts, unlimited overselling is possible. |
| **USD and English only.** | No multi-currency or Arabic/RTL, despite a Lebanese payment provider. |
| **Single process only.** Rate limiting and login lockout are in-memory. | `pm2 instances: 1` is a correctness constraint. Scaling out needs a shared store (Redis) first. |
| **Email verification is not required to order.** | Order confirmations can go to unverified addresses. |
| **Reviews auto-publish.** | The moderation UI exists but `AUTO_APPROVE_REVIEWS = true`. Spam goes live immediately. |
| **No foreign-key constraints** on `Order.userId`, `Quote.userId`, `Review.userId`. | Direct database deletion can orphan rows. The application paths are guarded. See `docs/TASKS_3.md`. |
| **No route-handler or E2E test coverage.** | 86 tests cover pure logic (money maths, throttling, IP resolution, magic bytes, sessions). The HTTP layer is verified manually via this checklist. |

---

## Sign-off

| Item | Date | By |
|---|---|---|
| Preflight passed | | |
| Sandbox payment rehearsal (incl. dropped callback) | | |
| Real card transaction verified and refunded | | |
| Restore drill passed | | |
| Credentials rotated | | |
