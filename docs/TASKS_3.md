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

## Phase 1 — High ✅ DONE

Verified: `npm audit --omit=dev` clean, typecheck clean, lint clean, **81 tests
passing** (was 58), production build succeeds.

| Area | What was wrong | Fix |
|---|---|---|
| **Observability** | No tracker, no `onRequestError`, 25 unstructured `console.*`, and **zero** error boundaries — a production failure was invisible unless someone SSHed in and grepped PM2 logs | `lib/logger.ts` (single-line JSON, levels, pluggable reporter); `onRequestError` implemented; `lib/observability.ts` vendor-neutral seam with optional `ERROR_WEBHOOK_URL` and secret redaction; `error.tsx`, `global-error.tsx`, `not-found.tsx`, admin `error.tsx`, store `loading.tsx`; email failures now surface (closes TASKS_2 P1-6) |
| **Build-time staleness** | `/`, `/contact`, `/store` were prerendered at build time with **no revalidation** — products added in admin and contact details changed in settings never reached the storefront | ISR at 60s (sitemap 1h). `/cart` and `/checkout` forced dynamic so the tax rate can't go stale |
| **CI never built** | The production build was first exercised on the live server during a release | Second CI job with an MSSQL service container running `prisma migrate deploy` + `next build`; also `concurrency`, `permissions`, `timeout-minutes` |
| **Unbounded admin reads** | `/api/admin/orders` returned every order with every line item and every status-history row; reviews returned every reviewer email; users returned every row | Server-side pagination + filtering on all three; `hooks/usePagedResource.ts` shares abort/debounce/error handling; status tiles use SQL counts so they describe the whole table |
| **N+1 / full scans** | 50-item cart = 50 sequential queries; `/store` pulled the whole reviews table and filtered in JS; `POST /api/reviews` pulled the whole product table to find one row; `/store/[slug]` queried the product twice per render | `getProductsBySlugs`, `getApprovedReviews`, `getProductById`, and `getProductBySlug` wrapped in React `cache()` |
| **Auth** | Login skipped bcrypt for unknown emails (timing oracle); no per-account lockout; register returned a definitive 409; sliding session never expired; role change didn't revoke | Dummy-hash compare (measured 578ms vs 568ms); `lib/login-throttle.ts` with backoff and a 15m cap; neutral register response + `lib/auth-notifications.ts` emails the real owner; 7-day absolute lifetime via a non-renewing `sat` claim; role change bumps `tokenVersion` |
| **CSP** | `next.config.ts` had a comment describing a policy but **no directive** | Full CSP added. Nonces deliberately skipped — they force fully dynamic rendering, which would undo the ISR above; rationale documented inline. Also `poweredByHeader: false`, `X-Frame-Options: DENY`, images config with SVG blocked |
| **Upload** | `formData()` buffered the whole body before the 5 MB check; MIME type was client-asserted | `Content-Length` pre-check (413) and magic-byte sniffing — a disguised payload can no longer be stored with an image extension |
| **Dead `Category` table** | `/admin/categories` was write-only: products validated against a hardcoded array, so a created category could never be assigned, and deleting one silently hid its products | `getCategoryNames()` is now the source of truth for validation and every dropdown/filter; `Category` type loosened to `string`; delete refuses while products still reference it (409) |
| **Fire-and-forget email** | Order/quote notifications raced the response | `after()` from `next/server`; the order is snapshotted so the email reflects the state at the status change |
| **Assets** | ~32 MB on a first visit; 8.5 MB of it dead | Deleted the unreferenced `public/page-transition-frames/` (97 files); both preloaders batched and cancellable; transition frames skipped under `prefers-reduced-motion` |
| **Docs** | README documented an unimplemented preloader, `lib/*.dev.ts` paths that no longer exist, 3 of 20+ env vars, and a "create an admin" flow that cannot work on a fresh DB | All corrected; added the `NODE_ENV`/sandbox warning, the `db:seed` destructiveness warning, and a deployment section |

### Still open from Phase 1

- [x] **Dev machine upgraded to Node 24.18.0** (2026-07-29), matching `.nvmrc`
      and CI. Verified end to end: `npm ci`, audit (0 production advisories),
      typecheck, lint, 86 unit tests, 10 integration tests against local MSSQL,
      and a production build. Global CLIs survived (npm's user-scoped prefix).
- [ ] ⚠️ **The VPS still needs Node ≥ 20.19** — Prisma 7 will not install below
      it. `deploy/preflight.sh` hard-fails on this, so a deploy cannot silently
      proceed. Use the version in `.nvmrc` (24.18.0).
- [x] **Data-layer write coverage** — 10 integration tests now run against real
      MSSQL in CI (`npm run test:integration`): transactions, nested creates, the
      concurrent payment-settlement and status-transition guards, Decimal/BigInt
      round-tripping, and cascade delete.
- [ ] **Still no route-handler or E2E tests.** The 86 unit tests cover pure logic
      and the 10 integration tests cover the data layer, but `requireAdmin()`,
      the Whish callback handler and the checkout flow are still only verified
      manually via `docs/PRE-LAUNCH.md`.
- [ ] **Reviews still auto-publish** (`AUTO_APPROVE_REVIEWS = true`) despite the
      moderation UI existing. Needs a product decision.

## Phase 2 — Medium ✅ DONE

Verified: audit clean, typecheck clean, lint clean, **86 tests passing**, build
succeeds, and all 8 migrations apply cleanly to a scratch database from scratch
(the same thing a fresh production deploy does).

| Issue | Fix |
|---|---|
| **Missing indexes on hot paths** — `products.category` (related products, storefront filter) and `products.featured` (home page) were full scans; `orders.createdAt` is the sort key for every list; `orders.paymentStatus` drives the revenue aggregate and the reconciliation query | Migration `20260728210000_add_indexes_and_updated_at` adds all four, guarded with `IF NOT EXISTS` so it is re-runnable |
| **`updatedAt` was `@default(now())`** — set on INSERT and then only if a writer remembered; `attachWhishExternalId()` did not, so an order sent to payment kept a stale timestamp | Switched to Prisma's `@updatedAt` on Order/Quote/Review/ContactInquiry; the DB DEFAULT constraints are dropped in the same migration |
| **Deleting a product orphaned its reviews** — `Review.productId` has no FK and no cascade, so reviews survived, stayed visible in `/admin/reviews` pointing at nothing, and the `@@unique([userId, productId])` constraint then blocked reviewing a re-created product with the same id | `deleteProduct()` removes the product and its reviews in one `$transaction` |
| **Unguarded `JSON.parse`** on the four product array columns and on quote attachments — one malformed row took down the ENTIRE listing, not just that row | `parseJsonArray()` degrades to `[]` and logs; 5 tests cover malformed, non-array, JSON-null, and the one-bad-row-among-good-ones case |
| **Quote→order conversion TOCTOU** — the route read `convertedToOrderId`, created the order, then marked the quote; two concurrent admin clicks each created an order and only the second id was recorded, leaving the first untracked | `claimQuoteForConversion()` claims the quote atomically against a pre-generated order id *before* the order is created; `releaseQuoteClaim()` rolls the claim back if creation fails |
| **Order status TOCTOU** — two admins could both pass `canTransition()` against the same `from` state and both apply their transition | `updateOrderStatus()` scopes the update to the status it read; the loser matches zero rows and gets a retry |
| **Schema drift** — `contact_inquiries` declared bare `String` columns while the committed migration created tighter widths (`NVarChar(320)` etc.), so Prisma reported permanent drift against a correctly-migrated database | Schema annotated to match what the migration actually creates. The only remaining reported drift is the **deliberate** filtered unique index on `orders.whishExternalId` (MSSQL treats multiple NULLs as duplicates); documented inline so nobody regenerates it |
| **Tracked build junk** | Removed `alter code.bat` and the generated `graphify-out/` (1.6 MB) from tracking; added to `.gitignore` |

### Deliberately deferred: foreign-key constraints

`Order.userId`, `Quote.userId`, `Review.userId`, `Review.productId` and
`Quote.convertedToOrderId` are still plain strings with no FK.

Adding the constraints requires knowing the production data is already
consistent — on MSSQL the `ALTER TABLE ... ADD CONSTRAINT` **fails** if any
orphan row exists, which would abort a release mid-deploy. The observable defect
(orphaned reviews) is fixed in application code above.

To add them later: audit for orphans first
(`SELECT * FROM reviews WHERE productId NOT IN (SELECT id FROM products)` and
equivalents), decide per relation whether history should survive deletion
(`onDelete: SetNull` for orders, so a deleted customer does not erase their
order history), then write the migration.

## Phase 3 — Pre-launch validation (requires the VPS)

These are the only remaining items, and they need someone with access to the
production box. Everything mechanically checkable is now automated.

**Run `./deploy/preflight.sh https://yourdomain.com`** — it checks Node version,
`.env` permissions and contents, `NODE_ENV`, `AUTH_SECRET` strength, pending
migrations, whether MSSQL is publicly bound, upload-directory writability, a
recent backup, a recorded restore drill, a single PM2 instance, the health
endpoint, the cron jobs, and the live security headers. Exit 0 = mechanically
ready.

**Then work through [`docs/PRE-LAUNCH.md`](./PRE-LAUNCH.md)** for the parts a
script cannot verify:

- [ ] Sandbox payment rehearsal on the real VPS, **including a deliberately
      dropped callback** to prove `reconcile:payments` recovers it and sends
      exactly one confirmation email.
- [ ] One real low-value card transaction, confirmed as arriving in the Whish
      account, then refunded.
- [ ] Restore drill run and recorded.
- [ ] Every credential rotated (`AUTH_SECRET`, Whish, Resend, DB password).
- [ ] `ERROR_WEBHOOK_URL` pointed somewhere a human reads.
- [ ] Break something on purpose (stop MSSQL) and confirm you find out.

---

## Accepted risks (tell the buyer)

- **No stock quantity tracking.** Service-only by decision. If the model changes
  to shipping parts, this becomes a real oversell exposure.
- **No i18n / Arabic / RTL.** English + USD only, notable for a Lebanese market.
- **Single-instance rate limiting.** `lib/rate-limit.ts` is a process-local Map.
  PM2 `instances: 1` is a correctness constraint, not a tuning choice.
- **Email verification is not required to place an order** — order confirmations
  can go to unverified addresses.
- ~~Prisma 6→7 upgrade deferred~~ — **completed 2026-07-29**; see the banner in
  `docs/prisma-7-upgrade-plan.md`. Note this made Node ≥20.19 a hard install
  requirement.
- **Dev-only advisory** `brace-expansion` via eslint's `minimatch@3`; not fixable
  without breaking eslint, never executed at runtime.
