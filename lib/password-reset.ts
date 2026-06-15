/**
 * Password-reset token repository — MSSQL via Prisma.
 *
 * Tokens are single-use and expiring. Only the SHA-256 hash of the raw token is
 * persisted; the raw token is returned to the caller once (to email) and never
 * stored. Verification re-hashes the presented token and looks up by hash.
 */

import { randomUUID, randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';

/** How long a reset link stays valid. */
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Issues a fresh reset token for a user. Invalidates any outstanding tokens for
 * that user first, so only the latest link works. Returns the raw token to email.
 */
export async function createResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  // One active token per user: drop previous (unused) ones.
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });

  await prisma.passwordResetToken.create({
    data: {
      id: randomUUID(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Validates a raw token and, if valid, marks it used and returns the userId.
 * Returns null when the token is unknown, already used, or expired. Consumption
 * is atomic via a conditional updateMany so a token can't be redeemed twice.
 */
export async function consumeResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;

  const result = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (result.count !== 1) return null; // lost the race — already consumed

  return record.userId;
}
