/**
 * Admin bootstrap — creates (or promotes) a single admin account from env vars.
 *
 * A fresh production database has no admin, and public registration only ever
 * creates `role: 'user'`. Run this once after the first deploy:
 *
 *   ADMIN_BOOTSTRAP_EMAIL=you@example.com \
 *   ADMIN_BOOTSTRAP_PASSWORD='a-strong-password' \
 *   ADMIN_BOOTSTRAP_NAME='Site Admin' \
 *   npm run db:seed:admin
 *
 * Idempotent: if the email already exists it is promoted to admin (and its
 * password reset to the provided value); otherwise a new admin user is created.
 */

// MUST be first: this runs under `tsx`, not Next.js, and nothing else loads
// .env for a standalone script. Without it createPrismaAdapter() throws
// "DATABASE_URL is not set" even though .env sits right there in APP_DIR.
import 'dotenv/config';

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../lib/db/adapter';

// Prisma 7 requires a driver adapter — same wiring as lib/db/prisma.ts.
const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Administrator';

  if (!email || !password) {
    console.error(
      'Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD before running this script.'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Mark the address verified. There is no verification email to click for a
  // bootstrapped admin — the account is created by whoever already controls the
  // server — and leaving it null greets the operator with a permanent
  // "Email not verified" banner on their very first sign-in.
  const now = new Date();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        passwordHash,
        name,
        emailVerifiedAt: existing.emailVerifiedAt ?? now,
      },
    });
    console.log(`✓ Promoted existing user to admin: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        name,
        passwordHash,
        role: 'admin',
        emailVerifiedAt: now,
      },
    });
    console.log(`✓ Created admin user: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
