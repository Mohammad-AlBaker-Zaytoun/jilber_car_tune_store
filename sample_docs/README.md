# sample_docs

Reference snapshots of the **legacy JSON data stores** the app used before the
migration to MSSQL/Prisma. They document the original record shapes and double as
the seed source for a fresh database.

| File | Contents |
| --- | --- |
| `.dev-categories.json` | Product categories |
| `.dev-products.json` | Product catalog |
| `.dev-reviews.json` | Product reviews |
| `.dev-settings.json` | Admin shop settings |
| `.dev-users.json` | User accounts |

## Sanitized for commit

`.dev-users.json`, `.dev-reviews.json`, and `.dev-settings.json` have been
**scrubbed of real PII/secrets** (personal emails, names, phone, bcrypt hashes
were replaced with demo values). The catalog files are unchanged.

The demo admin in `.dev-users.json` is functional:

- **email:** `admin@example.com`
- **password:** `Demo1234!`

## How they're used

`prisma/seed.ts` reads these files from `sample_docs/` and imports them into MSSQL
via `npx prisma db seed` (falling back to `data/products.ts` for the catalog if a
file is absent). The import is idempotent (upsert by natural key).
