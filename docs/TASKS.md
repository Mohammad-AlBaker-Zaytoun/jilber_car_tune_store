# Production-Readiness Tasks

Post-MSSQL-migration review. Checked off as implemented on branch `feat/production-readiness`.

## 🐞 Bugs
- [x] **B1 (P1)** Quote→order conversion: `POST /api/admin/quotes/[id]/convert` seeds an order (customer/vehicle + related product or placeholder line), links it, notifies; admin button wired
- [x] **B2 (P2)** Profile "Member Since" — `createdAt` now in JWT/session; profile reads it (falls back to "—" for pre-existing tokens)
- [x] **B3 (P2)** P2002 → 409: `isUniqueConstraintError()` helper, mapped in `handleAdminError` + reviews POST
- [x] **B4 (P2)** checkout `setState` synchronously in effect → fixed in **Q7** sweep (prefill now via guarded adjust-state-during-render, not an effect)

## 🔒 Security / hardening
- [x] **S1 (P1)** Rate-limit login (5/min) + register (5/10min) via `lib/rate-limit.ts`
- [x] **S2 (P1)** Rate-limit public orders + quotes POST (8/min); also password-change (5/10min)
- [x] **S3 (P2)** CSRF protection for authed POST — `lib/csrf.ts` same-origin (Origin/Referer) check enforced in `proxy.ts` for all `/api` mutations; 6 unit tests
- [x] **S4 (P2)** `max()` length caps on order schema (quotes already capped)
- [x] **S5 (P2)** Atomic settings update — `updateSettings` upserts only provided fields in one statement (no read-merge-write)

## 🚧 Feature gaps
- [x] **F1 (P1)** Email notifications via Resend REST (`lib/email.ts`, env-gated by `RESEND_API_KEY`); order + quote hooks now send real mail
- [x] **F2 (P1)** Profile edit (`PATCH /api/account/profile`, re-issues token) + change password (`POST /api/account/password`); editable `ProfileForm`
- [x] **F3 (P1)** Forgot/reset password flow — `PasswordResetToken` model + migration (`20260616000000_add_password_reset_tokens`), hashed single-use tokens (`lib/password-reset.ts`), `POST /api/auth/forgot-password` (enumeration-safe) + `reset-password`, `/forgot-password` & `/reset-password` pages, "Forgot password?" link on sign-in. Email send is env-gated by F1. *Run `prisma migrate deploy` to apply the migration.*
- [ ] **F4 (P1)** Move product image upload to blob storage — *deferred: needs provider creds (Vercel Blob/S3/Cloudinary)*
- [ ] **F5 (P1/P2)** Real payment gateway — *deferred: needs product decision + Stripe keys*
- [x] **F6 (P2)** Default OG image — present at `public/og/default-og.jpg` (1200×630 JPEG); stale TODO removed from `site-config.ts`
- [ ] **F7 (P2)** Email verification on signup — *deferred: builds on F1 + F3*

## 🧹 Quality / tech-debt
- [x] **Q1 (P1)** Vitest + 19 tests (rate-limit, rating, safeRedirect open-redirect, order sanitize/ref); `npm test`
- [x] **Q2 (P2)** GitHub Actions CI (`.github/workflows/ci.yml`): typecheck + test hard gates, lint informational
- [x] **Q3 (P2)** Stable `orderBy` on `getProducts`/`getReviews` — products by name, reviews newest-first
- [x] **Q4 (P2)** Lint: all `no-html-link` `<a>`→`<Link>` (contact, 3 policy pages, Footer, Navbar); `^_` ignore pattern for unused vars in eslint config
- [x] **Q5 (P2)** Renamed all `lib/*.dev.ts` → `lib/*.ts` (8 files, 51 import sites updated); no `.dev` refs remain
- [x] **Q6 (P2)** Prisma 7 upgrade plan written → `docs/prisma-7-upgrade-plan.md` (Node ≥20.19 + `prisma.config.ts` migration are the gating steps)
- [x] **Q7 (P2)** React-hooks lint debt swept: 9× `set-state-in-effect` (incl. checkout B4), 6× `static-components` (hoisted `StatCard`), 1× `purity` (lazy-init random ref), 7× `<img>`→`next/image`. `eslint .` now clean

---
_Items needing external credentials/decisions (F4 blob keys, F5 Stripe, F7 provider) are scaffolded env-gated where possible and flagged._
