/**
 * Email-verification token repository — MSSQL via Prisma.
 *
 * Mirrors lib/password-reset.ts: single-use, expiring tokens where only the
 * SHA-256 hash of the raw token is persisted. The raw token is emailed once and
 * never stored. Verification re-hashes the presented token and looks it up.
 */

import { randomUUID, randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { sendEmail, emailLayout, escapeHtml } from '@/lib/email';
import { siteConfig } from '@/lib/seo/site-config';

/** How long a verification link stays valid. */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Issues a fresh verification token for a user, invalidating any outstanding
 * (unused) ones first. Returns the raw token to email.
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.emailVerificationToken.deleteMany({ where: { userId, usedAt: null } });

  await prisma.emailVerificationToken.create({
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
 * Returns null when unknown, already used, or expired. Consumption is atomic via
 * a conditional updateMany so a token can't be redeemed twice.
 */
export async function consumeVerificationToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;

  const result = await prisma.emailVerificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (result.count !== 1) return null; // lost the race — already consumed

  return record.userId;
}

/**
 * Issues a token and emails the verification link. Env-gated by RESEND_API_KEY
 * (a no-op log in dev). Best-effort — never throws to the caller.
 */
export async function sendVerificationEmail(userId: string, name: string, email: string): Promise<void> {
  const rawToken = await createVerificationToken(userId);
  const verifyUrl = `${siteConfig.siteUrl}/verify-email?token=${rawToken}`;
  await sendEmail({
    to: email,
    subject: 'Confirm your JILBER email',
    html: emailLayout(
      'Confirm your email',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Thanks for creating an account. Please confirm your email address to finish setting up. This link expires in 24 hours.</p>
       <p style="margin:24px 0">
         <a href="${verifyUrl}" style="background:#0891b2;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold;border-radius:4px;display:inline-block">Confirm email</a>
       </p>
       <p style="font-size:12px;color:#71717a">If you didn't create this account, you can ignore this email.</p>`
    ),
  });
}
