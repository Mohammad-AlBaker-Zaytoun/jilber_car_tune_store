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

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'admin', passwordHash, name },
    });
    console.log(`✓ Promoted existing user to admin: ${email}`);
  } else {
    await prisma.user.create({
      data: { id: randomUUID(), email, name, passwordHash, role: 'admin' },
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
