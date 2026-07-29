import { createHash } from 'crypto';

/**
 * Stable, non-reversible identifier for an email address, for logs.
 *
 * Auth logs record one line per failed login and per registration probe. Writing
 * the plaintext address turns the log sink — and ERROR_WEBHOOK_URL, which is
 * typically a chat channel, not a secrets store — into a customer list and a
 * ready-made lockout-target list for anyone with read access.
 *
 * The digest is deterministic, so the same address still correlates across lines
 * (which is what makes the logs useful for debugging), while being useless as a
 * contact list. Truncated because full-length adds nothing at this cardinality.
 */
export function hashEmail(email: string): string {
  return createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
    .slice(0, 12);
}
