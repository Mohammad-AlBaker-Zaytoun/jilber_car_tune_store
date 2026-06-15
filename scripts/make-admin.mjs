/**
 * Promote a user to admin by email — MSSQL via Prisma.
 *
 * Usage:
 *   node scripts/make-admin.mjs user@example.com
 *
 * The user must have signed up first (so a row exists in the users table).
 * Requires DATABASE_URL to be set (reads .env via Prisma).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const prev = user.role ?? 'user';
  await prisma.user.update({ where: { email }, data: { role: 'admin' } });

  console.log(`✓ ${user.name} (${email}) promoted from "${prev}" → "admin"`);
  console.log('  Sign out and back in for the new role to take effect.');
} catch (err) {
  console.error('Failed to promote user:', err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
