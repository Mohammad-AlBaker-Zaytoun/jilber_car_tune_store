@AGENTS.md

# Pro Tuning (JILBER car tune store) — project context

Full-stack e-commerce + service-booking site for an automotive performance
tuning workshop in Lebanon. Customers browse a catalog, check out (workshop /
bank / card), or request a quote; an admin panel runs orders, quotes, reviews,
inquiries and shop settings. It handles **real money (Whish Money) and customer
PII** and is deployed to a single self-managed VPS.

Owner decisions that constrain all work (from `docs/TASKS_3.md`):
**service-only business** (no stock quantities, just `inStock`), **USD only,
English only** (no i18n/RTL), single VPS with **one** Node process.

## Stack (trust `package.json`, not the README table — it is stale)

- **Next.js 16.3** App Router + Turbopack, **React 19.2**, TypeScript 5 strict
- **Prisma 7.9** with the **`@prisma/adapter-mssql`** driver adapter → **Microsoft SQL Server 2022**
- Auth: JWT (`jose`, HS256) in an httpOnly cookie + `bcryptjs`
- Validation **Zod 4**, client state **Zustand 5** (cart only), Tailwind CSS v4, `lucide-react`
- Payments `whish-pay`; email via Resend REST (no SDK)
- Tests: Vitest 4 (unit + integration), Playwright (E2E)
- Node **24.18.0** (`.nvmrc`); hard minimum 20.19 — Prisma 7 and Vitest 4 refuse older

Next 16 differs from training data: middleware is now **`proxy.ts`** (root),
route `params` are a **`Promise`** (`const { id } = await params`), and
post-response work uses **`after()`** from `next/server`. When unsure, read
`node_modules/next/dist/docs/` (see AGENTS.md).

## Commands

```bash
npm ci                       # postinstall runs `prisma generate` (needs Prisma's binary host)
npm run dev                  # http://localhost:3000
npm test                     # unit tests, DB-free (tests/*.test.ts)
npm run test:integration     # real MSSQL via DATABASE_URL (tests/integration/)
npm run test:e2e             # rebuilds, then Playwright on :4310 + :4311
npm run test:e2e:only        # skip the rebuild (only when app code is unchanged)
npx tsc --noEmit             # type-check
npx eslint .                 # lint (CI runs this, not `npm run lint`)
npm run build                # prisma generate && next build — needs a live DB (prerenders from MSSQL)
npx prisma migrate deploy    # apply committed migrations
npm run db:migrate           # ONLY when authoring a new migration
npm run db:seed              # DEV ONLY, destructive — see "Danger" below
npm run db:seed:admin        # first admin from ADMIN_BOOTSTRAP_* env
npm run reconcile:payments   # recover card orders whose Whish callback was lost
```

CI (`.github/workflows/ci.yml`) = `verify` (npm audit --omit=dev, tsc, unit
tests, eslint) → `build` (MSSQL service, migrate deploy, integration tests,
build) and `e2e`. Run tsc + `npm test` + `npx eslint .` before calling work done.

Local setup: copy `.env.example` → `.env`; required vars are `DATABASE_URL`,
`AUTH_SECRET` (≥32 chars — the app refuses to boot otherwise), and
`NEXT_PUBLIC_SITE_URL` (no trailing slash). SQL Server runs in Docker per README.

## Layout

```
app/(shop)/      storefront: store, store/[slug], cart, checkout(/pay|success|failure), quote, contact, account/*
app/(auth)/      signin, signup, forgot/reset-password, verify-email
app/(admin)/     admin/* — dashboard, products, categories, orders, quotes, reviews, inquiries, users, settings
app/api/         route handlers (auth, account, orders, quotes, reviews, contact, admin/*, whish/callback, health)
components/      UI by feature (admin/, store/, checkout/, account/, auth/, transition/, …)
lib/             ALL server logic: repositories, auth, payments, email, rate limit, logging
lib/db/          prisma.ts (lazy singleton proxy) + adapter.ts (PrismaMssql)
lib/payments/    whish.ts, whish-settle.ts, whish-health.ts (circuit breaker), whish-boot.ts, pay-token.ts
types/           admin.ts (Order, statuses, Settings…), quotes.ts
proxy.ts         CSRF origin gate for /api/*, page auth redirects, sliding session renewal
instrumentation.ts  boot-time asserts (AUTH_SECRET, Whish env) + onRequestError logging
deploy/          VPS scripts: deploy.sh, nginx.conf, ecosystem.config.js (PM2), backup/restore, crontab
docs/            TASKS_3.md (current status), deployment.md, PRE-LAUNCH.md, E2E-TESTING.md
```

`docs/TASKS.md` and `docs/TASKS_2.md` are **stale**; `docs/TASKS_3.md` is the source of truth.

## Architecture & conventions

**Data access goes through repositories.** Route handlers and server components
call `lib/products.ts`, `lib/orders.ts`, `lib/users.ts`, `lib/quotes.ts`,
`lib/reviews.ts`, `lib/settings.ts`, `lib/categories.ts`, `lib/inquiries.ts` —
never Prisma directly. Repositories map rows to the app types in `types/`
(Decimal → number, Date → ISO string, flat `customer*`/`vehicle*` columns →
nested objects, JSON-string columns → arrays).

**SQL Server schema rules** (`prisma/schema.prisma`):
- No enums → status/role/priority are `String`; the allowed values live in TS unions (`types/`) and Zod schemas. Update both when adding a value.
- No `Json` → arrays are `NVarChar(Max)` JSON strings (`specs`, `images`, `attachments`, `additionalEmails`), (de)serialized in the repo.
- Every indexed/unique/FK string column needs `@db.NVarChar(n)` (index key byte limit).
- Money is `Decimal(10,2)`. IDs are app-generated strings (`NVarChar(64)`).
- `Setting` is a singleton row (`id = 1`).
- Schema changes = new migration under `prisma/migrations/`; never edit applied ones.

**Route handler pattern** (copy an existing handler, e.g. `app/api/admin/orders/[id]/route.ts`):
1. Rate-limit public mutations: `rateLimit(key + getClientIp(req), n, windowMs)` → `tooManyRequests()`.
2. Admin routes: `const admin = await requireAdmin()` in `try`, and `catch (err) { return handleAdminError(err) }`.
3. `schema.safeParse(body)`; return generic 400 messages.
4. Call repositories; emails/notifications go in `after(() => …)` so they never delay or fail the response (snapshot data first).
5. Log with `logger.info|warn|error('area.event_name', err?, { context })` — structured JSON, no bare `console.*`.

**Auth.** `lib/auth.ts` = JWT/cookie helpers, edge-safe (used by `proxy.ts`).
`lib/session.ts` = `getSession()` / `getSessionWithUser()`, server-only, does a
DB read to check `tokenVersion` (password change / role change revokes tokens).
`requireAdmin()` re-checks the **live** role. Cookie `protuning-session`: 24h
sliding, 7-day absolute cap via the `sat` claim. Don't import `lib/session.ts`
or `lib/admin.ts` into `proxy.ts`.

**Order lifecycle.** Allowed transitions are in
`components/admin/orderStatus.ts` (`ALLOWED_TRANSITIONS`, `canTransition`) and
enforced server-side (422). `updateOrderStatus()` is an optimistic
conditional `updateMany` (`where: { id, status: prev.status }`) so two admins
can't both apply a transition; it then inserts an `OrderStatusHistory` row as a
separate write (not one transaction). Quotes have no enforced transitions.

**Money.** `lib/currency.ts` is the single source: `STORE_CURRENCY = 'USD'`,
`computeTotals(subtotal, taxRate)`, `formatMoney`. Cart UI and `POST /api/orders`
use the same `computeTotals` so displayed total = charged total. The server
always prices from the DB; the cart's `expectedPrice` only detects drift
(409 `PRICE_CHANGED`). `inStock` and currency are enforced server-side.

**Caching.** `/`, `/store`, `/contact` use ISR (60s); `/cart`, `/checkout`,
`/checkout/pay` are `force-dynamic` so the tax rate is never stale.

**Front end.** Mostly server components; client components are marked
`'use client'`. Cart = Zustand persisted to localStorage (`protuning-cart`,
`lib/cart.ts`). Dark theme; per-product gradients via inline `style` (why CSP
keeps `'unsafe-inline'` for styles). Canvas frame-sequence heroes
(`ScrollFrameHero`, `StoreScrollHero`) and a page-transition system
(`components/transition/`: "cinematic" 72-frame on storefront, "light" fade in
admin, skipped under `prefers-reduced-motion`). Frame folders in `public/` are
~50 MB — don't add more casually.

**Code style.** Comments explain *why* — usually the bug or incident that forced
the design. Keep that style and don't strip those comments; they encode
production lessons. Commits are Conventional Commits with a scope:
`feat(admin): …`, `fix(store): …`, `chore(deps): …`, written as a sentence
about the outcome. Unused bindings use a `_` prefix.

## Load-bearing invariants — do not "fix" these

- **PM2 runs exactly one instance** (`deploy/ecosystem.config.js`, fork mode). The rate limiter, login throttle and Whish circuit breaker are in-process; more workers silently weaken them. Multi-instance would need Redis first.
- **In-process singletons live on `globalThis`** (Prisma client, circuit breaker). Next emits route handlers and page renders as separate chunks; a module-level `const` is *not* shared between them.
- **`lib/db/prisma.ts` is a lazy Proxy on purpose** — importing a repository must not require `DATABASE_URL` (unit tests import pure helpers from those files).
- **`Order.whishExternalId` drift is intentional.** The migration creates a *filtered* unique index (`WHERE … IS NOT NULL`); Prisma can't express it, so `migrate diff` always reports drift. Don't regenerate it.
- **`/api/whish/callback` is CSRF-exempt** in `proxy.ts` because the gateway calls it server-to-server. It's safe only because `settleWhishOrder()` re-queries Whish and checks the amount; never trust callback query params.
- **One settlement path:** callback and `scripts/reconcile-payments.ts` both use `lib/payments/whish-settle.ts`; `markOrderPaidByWhish()` is an atomic conditional `updateMany`. Keep it idempotent (confirmation email exactly once).
- **Gateway failure must not lose the order:** a failed card initiation captures the order without payment, emails a signed pay link, and trips the breaker (`app/api/orders/route.ts` → `captureWithoutPayment`).
- **`getClientIp()` reads X-Forwarded-For from the right** using `TRUSTED_PROXY_COUNT`; the leftmost entry is client-controlled.
- **CSRF compares Origin to `X-Forwarded-Host`/`Host`,** not `nextUrl.host` (which is `localhost:3000` behind nginx).
- **No CSP nonces** — they would force dynamic rendering and kill ISR. No `output: 'standalone'` — `tsx` and the Prisma CLI are needed at runtime.

## Danger zones

- **`NODE_ENV=production` selects real Whish charges.** Anything else hits the sandbox, where checkout looks successful and no money moves. `whish-boot.ts` refuses to boot with credentials set outside production unless `WHISH_ALLOW_SANDBOX=1`.
- **`npm run db:seed` wipes orders and resets settings.** It refuses on `NODE_ENV=production` or a non-local DB host; the override is `SEED_ALLOW_DESTRUCTIVE=yes-i-know-this-wipes-data`. Never run it against a real database.
- **Rotating `AUTH_SECRET`** logs everyone out *and* invalidates all emailed pay links.
- **`ALLOW_PLAINTEXT_HTTP=1`** drops `upgrade-insecure-requests` from the CSP — test/staging builds only (`scripts/build-e2e.mjs`). In production Safari would otherwise go blank.
- Never commit `.env` or root-level `.dev-*.json` files (real PII). Sanitized snapshots live in `sample_docs/`.

## Testing notes

- Unit tests cover pure helpers in `lib/` and run without a DB; put new ones in `tests/<area>.test.ts`.
- Integration tests (`tests/integration/*.integration.test.ts`) hit real MSSQL serially — use them for transactions, conditional updates, Decimal/BigInt round-trips.
- E2E runs two `next start` servers: `:4310` (no gateway) and `:4311` (gateway configured with invalid creds — a real failure, not a mock). `workers: 1` because specs share server state. The happy card path is manual (`docs/PRE-LAUNCH.md`).
- If `@prisma/client` reports missing exports (`PrismaClient`, `User`), the client wasn't generated — run `npx prisma generate`.

## Open items (as of `docs/TASKS_3.md`)

- VPS still needs Node ≥ 20.19 (`deploy/preflight.sh` hard-fails until then).
- Reviews auto-publish (`AUTO_APPROVE_REVIEWS = true` in `lib/reviews.ts`) despite the moderation UI.
- Pre-launch: sandbox rehearsal on the VPS incl. a dropped callback, one real low-value card payment, restore drill, credential rotation, `ERROR_WEBHOOK_URL` wired up.
- README's stack table and auth section are out of date (Prisma 6 / Next 16.2.6 / "middleware").
