# Production-Readiness Tasks

Post-MSSQL-migration review. Checked off as implemented on branch `feat/production-readiness`.

## 🐞 Bugs
- [x] **B1 (P1)** Quote→order conversion: `POST /api/admin/quotes/[id]/convert` seeds an order (customer/vehicle + related product or placeholder line), links it, notifies; admin button wired
- [x] **B2 (P2)** Profile "Member Since" — `createdAt` now in JWT/session; profile reads it (falls back to "—" for pre-existing tokens)
- [x] **B3 (P2)** P2002 → 409: `isUniqueConstraintError()` helper, mapped in `handleAdminError` + reviews POST
- [~] **B4 (P2)** checkout `setState` synchronously in effect → folded into **Q7** (same rule class as 8 other components; sweep together to avoid destabilizing checkout)

## 🔒 Security / hardening
- [x] **S1 (P1)** Rate-limit login (5/min) + register (5/10min) via `lib/rate-limit.ts`
- [x] **S2 (P1)** Rate-limit public orders + quotes POST (8/min); also password-change (5/10min)
- [ ] **S3 (P2)** CSRF protection for authed POST (beyond sameSite=lax)
- [x] **S4 (P2)** `max()` length caps on order schema (quotes already capped)
- [ ] **S5 (P2)** Atomic settings update (avoid last-write-wins)

## 🚧 Feature gaps
- [x] **F1 (P1)** Email notifications via Resend REST (`lib/email.ts`, env-gated by `RESEND_API_KEY`); order + quote hooks now send real mail
- [x] **F2 (P1)** Profile edit (`PATCH /api/account/profile`, re-issues token) + change password (`POST /api/account/password`); editable `ProfileForm`
- [ ] **F3 (P1)** Forgot/reset password flow — *deferred: needs F1 email live + a reset-token table/migration*
- [ ] **F4 (P1)** Move product image upload to blob storage — *deferred: needs provider creds (Vercel Blob/S3/Cloudinary)*
- [ ] **F5 (P1/P2)** Real payment gateway — *deferred: needs product decision + Stripe keys*
- [ ] **F6 (P2)** Default OG image — *deferred: needs a 1200×630 binary asset*
- [ ] **F7 (P2)** Email verification on signup — *deferred: builds on F1 + F3*

## 🧹 Quality / tech-debt
- [x] **Q1 (P1)** Vitest + 19 tests (rate-limit, rating, safeRedirect open-redirect, order sanitize/ref); `npm test`
- [x] **Q2 (P2)** GitHub Actions CI (`.github/workflows/ci.yml`): typecheck + test hard gates, lint informational
- [x] **Q3 (P2)** Stable `orderBy` on `getProducts`/`getReviews` — products by name, reviews newest-first
- [x] **Q4 (P2)** Lint: all `no-html-link` `<a>`→`<Link>` (contact, 3 policy pages, Footer, Navbar); `^_` ignore pattern for unused vars in eslint config
- [ ] **Q5 (P2)** Rename `lib/*.dev.ts` (drop misleading `.dev` suffix)
- [ ] **Q6 (P2)** Plan Prisma 7 upgrade (needs Node ≥20.19)
- [ ] **Q7 (P2, NEW)** React-hooks lint debt sweep (pre-existing): 9× `set-state-in-effect` (incl. checkout B4), 6× `static-components` (hoist nested component defs), 1× `purity`, 7× `<img>`→`next/image`

---
_Items needing external credentials/decisions (F4 blob keys, F5 Stripe, F7 provider) are scaffolded env-gated where possible and flagged._
