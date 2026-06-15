# Prisma 7 Upgrade Plan (Q6)

Status: **planning only** — not yet executed. Tracks the work to move this repo
from Prisma 6 to Prisma 7.

## Current state (as of this writing)

| Thing | Value |
|---|---|
| `prisma` / `@prisma/client` declared | `^6.3.1` |
| Resolved version | `6.19.3` |
| Generator | `prisma-client-js` (default output to `node_modules/@prisma/client`) |
| Datasource | `sqlserver` (MSSQL) |
| Node installed locally | `v20.17.0` |
| Seed config | `package.json` → `"prisma": { "seed": "tsx prisma/seed.ts" }` |
| `serverExternalPackages` | already set in `next.config.ts` (`@prisma/client`, `prisma`) |

Two deprecation warnings already surface on `prisma generate`:

1. `package.json#prisma` config block is deprecated → must move to a Prisma config file.
2. (general) Prisma 7 removes several Prisma 6 defaults.

## Blockers

- **Node ≥ 20.19 required.** Local is `20.17.0`. CI (`.github/workflows/ci.yml`)
  and any deploy runtime must be bumped first. This is the gating item.

## Steps (in order)

1. **Bump Node to ≥ 20.19 (ideally 22 LTS).**
   - Add `"engines": { "node": ">=20.19" }` to `package.json`.
   - Update `.github/workflows/ci.yml` `actions/setup-node` to `node-version: 22`.
   - Update any deploy target (Vercel Project Settings → Node.js version).

2. **Migrate Prisma config off `package.json`.**
   - Create `prisma.config.ts` at repo root and move the seed command there.
   - Remove the `"prisma"` block from `package.json`.
   - Verify `prisma generate` / `prisma migrate` still pick up `prisma/schema.prisma`.

3. **Read the official upgrade guide before touching the generator.**
   - https://www.prisma.io/docs/orm/more/upgrade-guides — follow the v6→v7 guide
     verbatim; do not rely on memory for breaking changes.
   - Confirm the MSSQL (`sqlserver`) connector's status under the new
     query-compiler / driver-adapter model, since that is the riskiest area for
     this repo.

4. **Switch the generator (if required by v7).**
   - v7 moves toward the new `prisma-client` generator with an explicit `output`
     path. If required:
     - Set `output = "../lib/db/generated"` (or similar) in the generator block.
     - Add the output dir to `.gitignore` and to ESLint/TS ignores if generated.
     - Update the single import site `lib/db/prisma.ts` and re-point
       `import type { ... } from '@prisma/client'` usages in the repo
       (currently in `lib/*.dev.ts` repositories) to the new client path.
   - Update `serverExternalPackages` in `next.config.ts` if the package name changes.

5. **Regenerate + typecheck + test.**
   - `npx prisma generate`
   - `npx tsc --noEmit`
   - `npm test`
   - Run `prisma migrate deploy` against a scratch MSSQL DB to confirm the
     existing migrations + the new `password_reset_tokens` migration still apply.

6. **Smoke test data layer** end-to-end (login, product list, order create,
   quote create, settings update) against a real MSSQL instance.

## Risk notes

- The data layer is well isolated: every DB call goes through the `lib/*.dev.ts`
  repositories and `lib/db/prisma.ts`. A generator/client change touches only
  those files plus `@prisma/client` type imports — small blast radius.
- MSSQL is a less-exercised connector than Postgres; treat connector behaviour
  under v7's query compiler as the primary verification target.
- Do the Node bump and the `prisma.config.ts` migration as a **separate PR first**
  (both are safe under Prisma 6) to shrink the actual v7 PR.
