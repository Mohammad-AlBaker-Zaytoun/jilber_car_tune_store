/**
 * Per-account login throttling.
 *
 * IP-based limiting alone (lib/rate-limit.ts) does not stop credential stuffing:
 * an attacker with a botnet or a rotating proxy pool gets a fresh 5-per-minute
 * budget from every source address, all aimed at one known email. This adds a
 * counter keyed on the *account*, which no amount of IP rotation moves.
 *
 * Deliberately conservative so a real customer fat-fingering their password is
 * not locked out for long: a short lockout that resets on success, not an
 * account disable that needs support to undo.
 *
 * Same single-process caveat as lib/rate-limit.ts — see the note there.
 */

interface Attempt {
  failures: number;
  /** When the current lockout expires (0 = not locked). */
  lockedUntil: number;
  /** When an idle counter should be forgotten. */
  expiresAt: number;
}

const attempts = new Map<string, Attempt>();

/** Failures before the first lockout. */
const THRESHOLD = 8;
/** Lockout length, doubling per subsequent failure, capped. */
const BASE_LOCKOUT_MS = 60_000;
const MAX_LOCKOUT_MS = 15 * 60_000;
/** Forget a counter after this long with no attempts. */
const IDLE_TTL_MS = 30 * 60_000;

function key(email: string): string {
  return email.trim().toLowerCase();
}

function prune(now: number): void {
  if (attempts.size <= 5000) return;
  for (const [k, a] of attempts) {
    if (now > a.expiresAt && now > a.lockedUntil) attempts.delete(k);
  }
}

export interface ThrottleState {
  locked: boolean;
  /** Seconds until the account accepts attempts again. */
  retryAfter: number;
}

/** Checks whether this account is currently locked out. Does not record anything. */
export function checkLoginThrottle(email: string, now = Date.now()): ThrottleState {
  const entry = attempts.get(key(email));
  if (!entry || now >= entry.lockedUntil) return { locked: false, retryAfter: 0 };
  return { locked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
}

/** Records a failed attempt and returns the resulting state. */
export function recordLoginFailure(email: string, now = Date.now()): ThrottleState {
  prune(now);
  const k = key(email);
  const entry = attempts.get(k);

  // Reset a stale counter rather than letting yesterday's typos count.
  const failures = entry && now < entry.expiresAt ? entry.failures + 1 : 1;

  let lockedUntil = 0;
  if (failures >= THRESHOLD) {
    const over = failures - THRESHOLD;
    lockedUntil = now + Math.min(BASE_LOCKOUT_MS * 2 ** over, MAX_LOCKOUT_MS);
  }

  attempts.set(k, { failures, lockedUntil, expiresAt: now + IDLE_TTL_MS });

  return lockedUntil > now
    ? { locked: true, retryAfter: Math.ceil((lockedUntil - now) / 1000) }
    : { locked: false, retryAfter: 0 };
}

/** Clears the counter after a successful login. */
export function clearLoginFailures(email: string): void {
  attempts.delete(key(email));
}

/** Test seam. */
export function __resetLoginThrottle(): void {
  attempts.clear();
}
