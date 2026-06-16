# Production-Readiness Review #2 — Deep Audit

_Date: 2026-06-16 · Reviewer pass after `feat/production-readiness` (TASKS.md)._
_Method: traced code against TASKS.md claims + graphify map (`graphify-out/`). Ran `npx tsc --noEmit` (exit 0) and `npm test` (25/25 pass)._
_**Deployment target: self-managed VPS** (long-lived `next start` Node process behind a reverse proxy) — **not** Vercel/serverless. Severities below are reassessed for that target._

## Verified-good baseline (no action needed)
These TASKS.md claims were traced to real, correct code:
- **Auth**: JWT via `jose`, `AUTH_SECRET` validated ≥32 chars at startup, httpOnly + `secure` (prod) + `sameSite=lax` cookie. ✓
- **Admin authz**: `requireAdmin()` re-verifies live role from DB (demotion takes effect immediately); last-admin demotion blocked; self-role-edit blocked. ✓
- **CSRF**: same-origin Origin/Referer check in `proxy.ts` for all `/api` mutations; missing-header request rejected. ✓
- **Password reset**: only SHA-256 hash stored, single-use via atomic conditional `updateMany`, 1-hour TTL, prior tokens invalidated, enumeration-safe `forgot-password`. ✓
- **Order totals**: subtotal/tax/total computed **server-side** from DB prices — no client price trust. ✓
- **JSON-LD**: all `dangerouslySetInnerHTML` go through `safeJsonLd()` (escapes `<`). ✓
- **Secrets**: `.env` / `.env.local` are gitignored; only `.env.example` is tracked. ✓
- **Next 16 conventions**: `proxy.ts` (not `middleware.ts`) is correct for Next 16.2.6 — verified against `node_modules/next/dist/docs`. ✓

---

## 🔴 P0 — Must resolve before go-live (VPS)

- [x] **P0-1 — No admin bootstrap path.** ✅ **Done.** Added idempotent `prisma/seed-admin.ts` + `npm run db:seed:admin`, gated by `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` / `ADMIN_BOOTSTRAP_NAME` (creates new admin or promotes existing user; bcrypt cost 12). Env keys documented in `.env.example`. _Run once after first deploy._

- [ ] **P0-2 — No real payment gateway.** Orders with `payment: 'card'` are accepted with `paymentStatus: 'unpaid'`; no charge occurs. This is TASKS.md **F5** (deferred). **Decision needed:** either integrate a gateway before launch, or remove the "card" option from the UI/schema and label the shop "pay in-store / bank transfer only" so the client isn't surprised. _(Product decision, host-independent.)_

- [x] **P0-3 — Image uploads need a persistent location + reverse-proxy serving.** ✅ **Code done / ⚠️ infra pending.** The upload route now reads `UPLOAD_DIR` (absolute fs path) and `UPLOAD_PUBLIC_PATH` (URL prefix) from env, defaulting to `public/products/uploads` for local dev. **Remaining (infra, see I-3):** on the VPS set `UPLOAD_DIR=/var/lib/jilber/uploads` on a persistent volume and add an nginx `location` serving `UPLOAD_PUBLIC_PATH` from it — otherwise a redeploy still wipes images. Documented in `.env.example`.

---

## 🟠 P1 — Security & correctness

- [x] **P1-1 — No HTTP security headers.** ✅ **Done (CSP pending).** Added a `headers()` block in `next.config.ts` applying `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, and HSTS (2y, preload — active over HTTPS only) to every route. **Deferred:** a full `Content-Security-Policy` — it needs a nonce to allow Next's inline runtime + the JSON-LD `<script>` blocks; left out to avoid breaking the app. Add with a nonce-based middleware pass post-launch.

- [ ] **P1-2 — Password change / reset does not revoke existing sessions.** _Intentionally deferred — needs an architecture decision._ After `POST /api/account/password` or reset, previously issued JWTs stay valid up to 24h. Proper revocation means giving up stateless JWTs: add `tokenVersion` to `User` + JWT claim, bump on password change/reset, and **read the live version on every authenticated request** (a per-request DB hit that the current stateless model avoids). **Decision for the team:** accept the 24h window, or take the DB-checked-session cost. Not done because it's a design tradeoff and isn't testable here without a live DB.

- [x] **P1-3 — HTML injection into outbound emails.** ✅ **Done.** Added `escapeHtml()` to `lib/email.ts` and applied it to every interpolated user value in `order-notifications.ts`, `quote-notifications.ts`, and the `forgot-password` reset email. Covered by 4 new unit tests in `tests/email-escape.test.ts`.

- [ ] **P1-4 — `getClientIp` trusts the first `x-forwarded-for` hop.** Both rate limiters key on a client-supplied header. On a VPS behind a reverse proxy this is **safe only if** the proxy is configured to _overwrite_ (not append) `X-Forwarded-For` with the real peer IP. If nginx passes a client-supplied XFF through, an attacker rotates it to bypass limits / poison buckets. **Fix:** in nginx use `proxy_set_header X-Forwarded-For $remote_addr;` (or read `X-Real-IP` and trust only the proxy hop). Verify before launch.

- [x] **P1-5 — Duplicate/divergent rate-limit configs.** ✅ **Done (single-process caveat stands).** Removed the duplicate inline limiter from `proxy.ts`; the per-route `lib/rate-limit.ts` calls are now the single source of truth (login 5/60s, register 5/10min, orders & quotes 8/60s, password/forgot/reset 5/10min). **Still true / infra:** the limiter is in-memory, so it's correct only on a **single** process — run PM2 in `fork` mode / `instances: 1` (see I-1), or move to Redis if you scale out.

- [ ] **P1-6 — Fire-and-forget email: fine on VPS, but failures are invisible.** `notifyOrderCreated()` / `notifyQuoteSubmitted()` are not awaited. On a long-lived VPS process the `fetch` to Resend completes normally (unlike serverless, where it would be dropped — **not a blocker here**). But sends are best-effort and only `console.error` on failure. **Fix (P2-grade):** surface failures via the error tracker (P2-2) so a misconfigured Resend key doesn't silently swallow every order email.

---

## 🟡 P2 — Quality, infra & observability

- [x] **P2-1 — Weak CI gates.** ✅ **Lint hardened / build still deferred.** Flipped the lint step to a hard gate (`eslint .` is clean after Q7), so lint failures now block CI alongside typecheck + tests. **Still deferred:** `next build` in CI — it prerenders pages that read from MSSQL, so it needs a live DB (or forcing `dynamic` on those routes). Add a DB service to CI or mark those pages dynamic if you want build coverage.

- [ ] **P2-2 — No error tracking / structured logging.** Only `console.error`. **Fix:** add Sentry (or equivalent) for server + client; you'll want this live during the client demo period.

- [ ] **P2-3 — Deploy pipeline must run migrations.** F3 added `PasswordResetToken` migration; ensure the deploy step runs `prisma migrate deploy` (not just `generate`). Document in runbook.

- [x] **P2-4 — Add a health check endpoint.** ✅ **Done.** Added `GET /api/health` (`app/api/health/route.ts`, `force-dynamic`): runs `SELECT 1`, returns 200 `{status:'ok',db:'up'}` or 503 when the DB is unreachable. Point the uptime monitor / nginx probe at it.

- [x] **P2-5 — Missing DB indexes on status filters.** ✅ **Done (migration pending deploy).** Added `@@index([status])` to `Order`, `Quote`, `Review` in `schema.prisma` and authored migration `20260616120000_add_status_indexes`. **Apply on deploy** with `prisma migrate deploy` (see I-7).

- [x] **P2-6 — Verify Prisma `Decimal` → `number` conversion.** ✅ **Verified — no bug.** `lib/products.ts` `rowToProduct()` does `price: Number(row.price)` (and `oldPrice` likewise), so the order route's `i.price * i.quantity` operates on real JS numbers. The existing `tests/orders-sanitize.test.ts` covers the order math path.

- [ ] **P2-7 — Prisma 6 → 7 upgrade (TASKS.md Q6).** Plan exists in `docs/prisma-7-upgrade-plan.md`; not executed. Gated on Node ≥20.19 + `prisma.config.ts`. Schedule post-launch unless a v7 fix is needed.

- [ ] **P2-8 — Email verification on signup (TASKS.md F7).** Still deferred; builds on F1+F3. Decide if launch requires verified emails (affects order/quote contactability).

---

## 🖥️ VPS infrastructure checklist (new — not covered by the app code)

The app passes its gates, but a VPS deploy needs an ops layer the repo doesn't provide. None of this exists in the codebase yet.

- [ ] **I-1 — Process manager.** Run under PM2 or a `systemd` unit so the app restarts on crash/reboot. **If PM2: use `fork` mode / `instances: 1`** (see P1-5) or rate limiting & any in-memory state break. Set `NODE_ENV=production`.
- [ ] **I-2 — Reverse proxy + TLS.** nginx (or Caddy) terminating HTTPS via Let's Encrypt/certbot, proxying to `next start` on `127.0.0.1:3000`. Add HSTS here or via P1-1. Set `proxy_set_header X-Forwarded-For` correctly (P1-4) and a sane `client_max_body_size` (≥ the 5 MB upload limit).
- [ ] **I-3 — Static serving for uploads.** nginx `location /products/uploads/ { ... }` pointing at the persistent upload dir (P0-3), so image serving doesn't round-trip through Node.
- [ ] **I-4 — Firewall.** `ufw`/security-group: expose only 80/443 (and SSH, ideally key-only + non-default port). **MSSQL port 1433 must not be publicly reachable** — bind to localhost or a private network.
- [ ] **I-5 — Secrets on disk.** `.env` on the server with `chmod 600`, owned by the app user. Confirm `AUTH_SECRET` is a fresh 32+ char random value (not the `.env.example` placeholder) and `NODE_ENV=production` so the session cookie gets the `secure` flag.
- [ ] **I-6 — Database backups.** Scheduled MSSQL backups + a tested restore. No backup story exists today.
- [ ] **I-7 — Migrations on deploy.** Deploy script runs `prisma migrate deploy` (applies the F3 `PasswordResetToken` migration and future ones) before restarting the process.
- [ ] **I-8 — Log capture & rotation.** App logs to stdout/stderr; ensure PM2/journald captures them and rotates (PM2: `pm2-logrotate`). Pair with the error tracker (P2-2).
- [ ] **I-9 — Edge rate limiting / abuse protection.** No Vercel firewall here — add nginx-level `limit_req` / fail2ban as defense-in-depth in front of the app's own limiter, and to blunt L7 floods.

---

## Suggested talking points for the client meeting
1. **Core app is solid**: auth, authz, CSRF, password reset, server-side pricing, SEO, and the test/typecheck gates are real and passing.
2. **Good news on the VPS target**: the items that would have been hard serverless blockers — in-memory rate limiting, local-disk image uploads, fire-and-forget email — all **work on a long-lived VPS process**. They've been downgraded; the local-disk upload just needs a persistent path + an nginx serving rule (P0-3), no third-party storage provider required.
3. **Two genuine product decisions** (need _your_ input, not just eng time): payments (P0-2 — integrate a gateway or drop the "card" option) and whether signup email-verification is required at launch (P2-8).
4. **The remaining engineering blocker** is small: there's no way to create the first admin on a fresh DB (P0-1) — a short bootstrap script fixes it.
5. **Quick, high-credibility wins before the demo**: HTTP security headers (P1-1) and session revocation on password change (P1-2).
6. **Biggest gap is ops, not code** (the VPS checklist, I-1…I-9): process manager, TLS reverse proxy, firewall (keep MSSQL off the public internet), DB backups, and migrations-on-deploy. The repo ships no deployment/ops tooling yet — budget time for it.
