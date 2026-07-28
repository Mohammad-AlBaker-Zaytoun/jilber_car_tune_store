# Production-Readiness Review #3 — Pre-Sale Hardening

Audit date **2026-07-28**. Scope: the system is being sold and deployed to a
self-managed VPS, handling real money via Whish Money and storing customer PII.

Supersedes `docs/TASKS_2.md`, which is **stale** — it lists Whish payments,
session revocation, and email verification as open when all three shipped.
Treat this file as the current status.

**Decisions locked with the owner:**

| Decision | Consequence |
|---|---|
| Service-only business | No stock quantity system. `inStock` enforced server-side only. |
| USD only, English only | Currency pinned in `lib/currency.ts`, removed from admin settings. No i18n/RTL. |
| Full hardening before launch | Phases 1–2 below must close before go-live. |
| Owner keeps operating the VPS | Error tracking is urgent; deploy scripts committed for repeatability. |

---

## Phase 0 — Blockers ✅ DONE

Everything here is merged and verified (`npm audit --omit=dev` clean, typecheck
clean, lint clean, 58 tests passing, production build succeeds).

| # | Issue | Fix |
|---|---|---|
| P0-1 | `next@16.2.6` carried **9 advisories**, incl. GHSA-6gpp-xcg3-4w24 (proxy/middleware bypass with Turbopack — the app's only auth+CSRF gate) | Bumped to **16.2.12**; `overrides` force `sharp@^0.35.3` (libvips CVEs) and `postcss@^8.5.24`. Production tree now reports **0 vulnerabilities**. Added `npm audit --omit=dev` CI gate + `.github/dependabot.yml`. |
| P0-1b | **Node 20 reached EOL in April 2026** — the target runtime receives no security patches | `.nvmrc` pins **24.18.0** (current LTS); CI reads it; `engines` set to `>=20.9.0`. **Local + VPS still need upgrading — see Phase 1.** |
| P0-2 | `prisma/seed.ts` had no production guard: it overwrote every product field, reset Settings, `deleteMany`'d orders, and seeded `admin@example.com` with a **git-tracked bcrypt hash** | `assertNotProduction()` refuses on `NODE_ENV=production` *or* a non-local `DATABASE_URL`, with a `SEED_ALLOW_DESTRUCTIVE` escape hatch. Seeded users are forced to `role: 'user'`; the snapshot's `role` field was stripped. |
| P0-3 | *"Secure mock checkout. No real payment processed."* rendered above the Place Order button on the live card flow | Replaced with an accurate Whish processing notice. |
| P0-4 | Cart hardcoded 10% tax while the server charged the admin-set rate — **displayed total ≠ charged total** | Single `computeTotals()` in `lib/currency.ts` used by both. `/cart` and `/checkout` became server shells that pass the live rate, marked `force-dynamic` so it can't go stale. |
| P0-5 | Card payments never cleared the cart — a paying customer returned to a full cart and could pay twice | `SuccessContent` clears on mount, keyed on a real `ref`. |
| P0-6 | Any admin-set currency was **charged as USD** by `toWhishCurrency()` while `shouldMarkPaid()` rejected it → money taken, order stuck `unpaid`, no email | Currency pinned to USD in `lib/currency.ts`; removed from the settings schema and UI; `toWhishCurrency()` now **throws** instead of coercing; non-USD products rejected at checkout. |
| P0-7 | `inStock` enforced only in the browser | Checked server-side in `POST /api/orders` (409). Also replaced the per-item query loop with one `getProductsBySlugs()` — a 50-item cart was 50 sequential round trips. |
| P0-8 | `whish-pay` picks sandbox vs production from `NODE_ENV` alone — a deploy missing it collects **no money** while checkout looks successful | `lib/payments/whish-boot.ts` refuses to boot in that state (opt out with `WHISH_ALLOW_SANDBOX=1`); `deploy.sh` checks `.env` first. |
| P0-9 | The callback was the **only** path marking an order paid, was a non-atomic read-then-write, and returned `307` to server-to-server calls | `markOrderPaidByWhish()` is now an atomic conditional `updateMany`; callback split into `POST` (200) and `GET` (redirect); added `scripts/reconcile-payments.ts` + a 15-minute cron to recover dropped callbacks. |
| P0-10 | No backup, and the runbook said *"own this"* | `deploy/backup.sh` (DB + uploads + `RESTORE VERIFYONLY` + off-box + retention) and `deploy/restore-drill.sh` (restores to a scratch DB, verifies, drops). Scheduled in `deploy/crontab.example`. |
| P0-11 | **Zero** deployment artifacts existed — the runbook was copy-paste only | Committed `deploy/`: `ecosystem.config.js`, `nginx.conf`, `proxy_params_jilber`, `deploy.sh` (aborts on any failure, health-gated), `backup.sh`, `restore-drill.sh`, `crontab.example`. |
| P0-12 | Rate limiter read the **leftmost** `X-Forwarded-For` entry — client-controlled, so every limit was bypassable | Reads the Nth entry from the right via `TRUSTED_PROXY_COUNT`; validates it looks like an IP; nginx overwrites XFF with `$remote_addr`. 9 new tests cover the spoofing cases. |

**Not done in Phase 0, deliberately:** `output: 'standalone'` was skipped. Its
stated benefit was keeping devDependencies off the server, but `tsx` (payment
reconciliation cron) and the `prisma` CLI (migrations) are genuinely needed at
runtime, and standalone would require rewriting the PM2 entrypoint and manually
copying `public/` and `.next/static`. The `npm audit --omit=dev` gate covers the
tree that actually executes.

---

## Phase 1 — High (must close before go-live)

- [ ] **Upgrade Node to 24 LTS** on the dev machine and the VPS, then raise
      `engines.node` to match `.nvmrc`. Currently local is 20.17.0 (EOL line).
- [ ] **Error tracking + structured logging.** No tracker, no `onRequestError`
      hook, 36 raw `console.*` calls, and **zero** `error.tsx` /
      `global-error.tsx` / `not-found.tsx` files. On the VPS a failure is
      invisible unless someone SSHes in and greps PM2 logs.
- [ ] **CI must run `next build`** (needs an MSSQL service container). Today the
      first time the production build runs is on the live server.
- [ ] **Test the money path.** 58 tests exist but still nothing covers route
      handlers, `requireAdmin()` (the single control on all 24 admin routes),
      callback idempotency under concurrent delivery, or any E2E flow.
- [ ] **Pagination** on `GET /api/admin/orders|reviews|users` — currently every
      order with every item and every status-history row in one response.
- [ ] **Caching.** No `use cache`/ISR anywhere; `/store` re-queries all products
      *and* all reviews per request, `/store/[slug]` queries twice per request.
- [ ] **CSP header** — `next.config.ts` has a comment describing the policy but
      no `Content-Security-Policy` key. Also set `poweredByHeader: false`.
- [ ] **Account enumeration** — register returns a distinct 409; login skips the
      bcrypt compare for unknown emails (timing oracle).
- [ ] **Per-account brute-force protection** — login is IP-keyed only.
- [ ] **Dead `Category` table** — admin category CRUD cannot affect the catalogue
      (products validate against the hardcoded `CATEGORIES` array). Either wire
      it through or remove the UI.
- [ ] **Floating notification promises** — order/quote emails fired without
      `await`/`after()`.
- [ ] **Assets** — delete the unreferenced `public/page-transition-frames/`
      (97 files, 8.5 MB); batch the frame preloader (~32 MB on first visit).
- [ ] Session absolute max lifetime; revoke tokens on role change; review
      auto-publish decision; upload `Content-Length` pre-check.

## Phase 2 — Medium

- [ ] Foreign keys + cascades (deleting a product orphans its reviews).
- [ ] Indexes: `Product.category`, `Product.featured`, `Order.createdAt`,
      `Order.paymentStatus`.
- [ ] `updatedAt` should be `@updatedAt`, not `@default(now())`.
- [ ] Guard the bare `JSON.parse` calls in `lib/products.ts` — one malformed row
      takes down the whole listing.
- [ ] TOCTOU guards on quote→order conversion and order status transitions.
- [ ] `images` config in `next.config.ts` (external URLs throw at runtime today).
- [ ] **README.md has ~8 concrete inaccuracies** — documents `lib/*.dev.ts` paths
      that no longer exist, lists 3 env vars when there are 20+, omits
      `db:seed:admin`, describes an unimplemented preloader, never mentions
      `docs/deployment.md`.
- [ ] Remove tracked build junk (`alter code.bat`, `graphify-out/`).

## Phase 3 — Pre-launch validation

- [ ] End-to-end payment rehearsal on the VPS with sandbox keys, **including a
      deliberately dropped callback** to prove reconciliation recovers it.
- [ ] Run `deploy/restore-drill.sh` and record the date in `docs/deployment.md`.
- [ ] Load sanity check on `/store` and `/api/admin/orders` with realistic volume.
- [ ] Rotate every credential: `AUTH_SECRET`, Whish, Resend, DB password.
- [ ] `chmod 600 .env`; confirm MSSQL:1433 is not publicly reachable; ufw on.

---

## Accepted risks (tell the buyer)

- **No stock quantity tracking.** Service-only by decision. If the model changes
  to shipping parts, this becomes a real oversell exposure.
- **No i18n / Arabic / RTL.** English + USD only, notable for a Lebanese market.
- **Single-instance rate limiting.** `lib/rate-limit.ts` is a process-local Map.
  PM2 `instances: 1` is a correctness constraint, not a tuning choice.
- **Email verification is not required to place an order** — order confirmations
  can go to unverified addresses.
- **Prisma 6→7 upgrade** deferred (`docs/prisma-7-upgrade-plan.md`).
- **Dev-only advisory** `brace-expansion` via eslint's `minimatch@3`; not fixable
  without breaking eslint, never executed at runtime.
