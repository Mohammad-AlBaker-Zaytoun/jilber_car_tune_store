# End-to-end tests

Real browsers, real HTTP, real MSSQL, a real payment gateway failure. Nothing in
this suite is mocked.

It exists for two audiences: CI, and a live demonstration in front of a buyer.
The second one shapes the design — the specs are named as claims a non-engineer
can follow, and the whole suite finishes in about two minutes.

---

## Running it

```bash
npm run test:e2e          # headless, every project (this is what CI runs)
npm run test:e2e:demo     # headed + slowed down, for showing someone
npm run test:e2e:ui       # Playwright's interactive UI mode
npm run test:e2e:report    # open the HTML report from the last run
npm run test:e2e:only     # skip the rebuild (specs changed, app did not)
```

**Everything except `:only` rebuilds the app first, and that is deliberate.** Both
test servers are `next start`, which serves whatever is already in `.next`. Without
the rebuild the suite happily tests a stale bundle and reports green on code that
is not the code you changed.

### Prerequisites

- `DATABASE_URL` and `AUTH_SECRET` in `.env` (the config loads `.env`, then
  `.env.local` on top).
- Browsers installed once: `npx playwright install chromium webkit`
- Ports **4310** and **4311** free.

---

## Demonstrating it to a client

```bash
npm run test:e2e:demo
```

Runs headed with a 350 ms delay between actions, so a browser window visibly
drives the store: browsing, adding to the cart, filling in checkout, and placing
an order — then does it again against a payment gateway that is genuinely broken.
The slow-down keys off `--headed`, so any headed run is followable; set
`E2E_DEMO=1` to force it elsewhere.

Allow about two minutes for the 38 tests in these two projects.

Talking points, in the order they appear on screen:

| What they see | What it proves |
|---|---|
| The cart total and the tax line | The total displayed is the total stored in the database. The cart used to hardcode 10% while the server charged the configured rate. |
| A tampered price is refused | Prices come from the database. Editing the browser's stored cart gets a `PRICE_CHANGED` refusal, not a cheap order. |
| An out-of-stock item is refused | Enforced on the server, not just by a greyed-out button. |
| The gateway outage run | Card payment fails for real, the order is still captured, the customer is told plainly that nothing was charged, and the cart is emptied so they cannot pay twice. |
| Card disappears from checkout | After three failures the circuit breaker stops offering a method that is known to be failing. Workshop and bank transfer keep working. |
| The admin section | The order appears with its payment method, is searchable, and advances through its lifecycle with an audit trail. |
| Revenue is not inflated | An unpaid card order captured during an outage does not count toward estimated revenue. |

Afterwards, `npm run test:e2e:report` opens the HTML report — a per-test
breakdown with a trace, video and screenshot for anything that failed. That is
the artefact to hand over, not the terminal output.

If a projector or a small screen is involved, `npm run test:e2e:ui` is easier to
narrate: it lists every test in a sidebar and you can run them one at a time.

---

## How it is put together

### Two servers, two payment realities

| Port | Whish credentials | What it exercises |
|---|---|---|
| 4310 | absent | Payment not configured yet — the storefront must still sell. |
| 4311 | present but invalid | Gateway configured and genuinely failing. |

4311 gets deliberately wrong credentials, so every call really does fail against
the real client code. No stub, no intercepted route. `WHISH_ALLOW_SANDBOX=1`
satisfies the boot assertion in `lib/payments/whish-boot.ts`.

### Projects

| Project | Engine | Covers |
|---|---|---|
| `setup` | — | Cleans, seeds, and signs in each role once per run. |
| `storefront` | Desktop Chrome | Everything except the outage specs. |
| `mobile` | Pixel 7 (Chromium) | Storefront and checkout on a phone viewport. |
| `mobile-safari` | iPhone 14 (WebKit) | Public pages in the real Safari engine. |
| `gateway-outage` | Desktop Chrome | The 4311 server, serially. |

`gateway-outage` runs serially and the whole suite runs with one worker, because
the circuit breaker and the rate limiter are per-process state — the same reason
`deploy/ecosystem.config.js` pins PM2 to `instances: 1`.

**Why `mobile` is Chromium and not WebKit.** The session cookie is `Secure`
(`lib/auth.ts`). WebKit refuses `Secure` cookies over plain http; Chromium
exempts localhost. `/checkout` requires a session, so an authenticated WebKit run
against these plaintext servers is impossible. Production is HTTPS, so this is a
limit of the test environment — not a reason to weaken a session cookie.
`mobile-safari` therefore covers the pages a visitor sees before signing in,
which is where a WebKit-only rendering bug would cost the most.

### Test data

Everything the suite creates is prefixed `e2e-` (`e2e/support/data.ts`). Cleanup
deletes only rows matching that prefix, because the suite runs against the same
MSSQL instance as development and anything looser would eventually delete real
data. Seeding is idempotent, so a half-finished run cannot poison the next one.

The tax rate is pinned to 10% through `updateSettings()`, which makes "the total
shown is the total charged" an exact assertion instead of an approximate one.

### Authentication

`e2e/global.setup.ts` signs in over the real login API once per role and saves
the cookies to `e2e/.auth/{customer,admin}.json`. Specs adopt a role with
`test.use({ storageState })` rather than driving the login form repeatedly. The
login form itself is still tested — in `auth.spec.ts`, which is where that
belongs.

---

## Two things the build has to know about

Both are documented at their definitions; repeated here because they are easy to
trip over.

**`ALLOW_PLAINTEXT_HTTP=1`** (`scripts/build-e2e.mjs` → `next.config.ts`). The
production CSP sends `upgrade-insecure-requests`. Safari honours that even on an
`http://` origin, so on a plaintext build every asset is requested over https,
nothing connects, and the app renders blank in Safari while looking perfectly
fine in Chrome. The flag drops that single directive and prints a loud warning.
**Never set it for a production build.** It also applies to any staging box
served without a certificate.

**`ORDER_RATE_LIMIT_PER_MINUTE`** (`.env.example`, default 8). The suite places
more orders per minute from one address than a real storefront ever would, and a
`429` there masks the guard each spec is actually asserting. `playwright.config.ts`
raises it for the test servers only. Throttling itself is still proven — over
real HTTP in `security.spec.ts`, and per-branch in `tests/rate-limit.test.ts`.

---

## What this layer caught that the others could not

Both were invisible to 101 unit tests and 19 integration tests, and both would
have reached customers.

**The circuit breaker was not shared with the page that reads it.** The build
emits a page render and a route handler as separate server chunks, so each got
its own instance of `lib/payments/whish-health.ts`. `POST /api/orders` tripped
the breaker and correctly answered 503, while `/checkout` kept rendering the Card
option from a copy of the state that had never seen a failure — walking customers
straight into the failing path the breaker exists to prevent. Fixed by pinning
the state to `globalThis`, following `lib/db/prisma.ts`.

**A dead product URL shipped two contradictory robots directives.** A streamed
`notFound()` answers HTTP 200 by design (the headers are already sent), so the
`noindex` in the HTML is the only thing keeping the URL out of search results —
and the root layout was inheriting `index, follow` onto it. Whether the page got
indexed came down to each crawler's conflict resolution.
