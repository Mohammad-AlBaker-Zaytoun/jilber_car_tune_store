/**
 * Per-account login throttling.
 *
 * IP-based limiting alone (lib/rate-limit.ts) does not stop credential
 * stuffing: an attacker with a botnet or a rotating proxy pool gets a fresh
 * 5-per-minute budget from every source address, all aimed at one email.
 *
 * KEYED ON (account, source IP) — NOT on the account alone.
 * -------------------------------------------------------
 * An account-only key is a remote denial-of-service primitive: anyone who knows
 * an address can lock its owner out permanently by submitting a wrong password
 * every few minutes from a single IP, because the lockout is evaluated BEFORE
 * the password is checked. The real owner, with the correct password, is denied.
 * That is worse than the attack it defends against, and it applies to the admin
 * account too.
 *
 * Keying on (account, IP) keeps the useful property — one source cannot grind
 * through passwords for one account — while leaving the legitimate owner, who
 * connects from a different address, entirely unaffected.
 *
 * A separate account-wide counter is kept for VISIBILITY ONLY: it never denies,
 * it just lets a genuinely distributed attack show up in the logs.
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
/** Account-wide failure counts, for alerting only — never used to deny. */
const accountWide = new Map<string, Attempt>();

/** Failures from ONE source before that source is locked out for this account. */
const THRESHOLD = 8;
/** Account-wide failures across all sources before we log a distributed attempt. */
const DISTRIBUTED_ALERT_THRESHOLD = 25;
/** Lockout length, doubling per subsequent failure, capped. */
const BASE_LOCKOUT_MS = 60_000;
const MAX_LOCKOUT_MS = 15 * 60_000;
/** Forget a counter after this long with no attempts. */
const IDLE_TTL_MS = 30 * 60_000;

/** Soft cap before opportunistic pruning; hard cap before wholesale clearing. */
const PRUNE_AT = 5_000;
const HARD_CAP = 20_000;

function normalise(email: string): string {
  return email.trim().toLowerCase();
}

function key(email: string, ip: string): string {
  return `${normalise(email)}|${ip}`;
}

/**
 * Bounded eviction.
 *
 * Pruning only expired entries cannot shrink a map whose entries are all live:
 * an attacker submitting failures for 200k distinct addresses inside the idle
 * TTL would grow it without limit and make every subsequent call scan the lot.
 * The hard cap guarantees termination at the cost of forgiving some counters.
 */
function prune(map: Map<string, Attempt>, now: number): void {
  if (map.size <= PRUNE_AT) return;
  for (const [k, a] of map) {
    if (now > a.expiresAt && now > a.lockedUntil) map.delete(k);
  }
  if (map.size > HARD_CAP) map.clear();
}

export interface ThrottleState {
  locked: boolean;
  /** Seconds until this source may attempt this account again. */
  retryAfter: number;
}

/** Checks whether this (account, source) pair is locked out. Records nothing. */
export function checkLoginThrottle(
  email: string,
  ip: string,
  now = Date.now()
): ThrottleState {
  const entry = attempts.get(key(email, ip));
  if (!entry || now >= entry.lockedUntil) return { locked: false, retryAfter: 0 };
  return { locked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
}

export interface FailureResult extends ThrottleState {
  /** True when failures across ALL sources for this account crossed the alert
   *  threshold — a sign of distributed credential stuffing. Never denies. */
  distributedAttack: boolean;
}

/** Records a failed attempt for this (account, source) pair. */
export function recordLoginFailure(
  email: string,
  ip: string,
  now = Date.now()
): FailureResult {
  prune(attempts, now);
  prune(accountWide, now);

  const k = key(email, ip);
  const entry = attempts.get(k);

  // Reset a stale counter rather than letting yesterday's typos count.
  const failures = entry && now < entry.expiresAt ? entry.failures + 1 : 1;

  let lockedUntil = 0;
  if (failures >= THRESHOLD) {
    const over = failures - THRESHOLD;
    lockedUntil = now + Math.min(BASE_LOCKOUT_MS * 2 ** over, MAX_LOCKOUT_MS);
  }
  attempts.set(k, { failures, lockedUntil, expiresAt: now + IDLE_TTL_MS });

  // Visibility-only account-wide tally.
  const acct = normalise(email);
  const wide = accountWide.get(acct);
  const wideFailures = wide && now < wide.expiresAt ? wide.failures + 1 : 1;
  accountWide.set(acct, {
    failures: wideFailures,
    lockedUntil: 0,
    expiresAt: now + IDLE_TTL_MS,
  });

  return {
    locked: lockedUntil > now,
    retryAfter: lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0,
    distributedAttack: wideFailures === DISTRIBUTED_ALERT_THRESHOLD,
  };
}

/** Clears this source's counter after a successful login. */
export function clearLoginFailures(email: string, ip: string): void {
  attempts.delete(key(email, ip));
  accountWide.delete(normalise(email));
}

/** Test seam. */
export function __resetLoginThrottle(): void {
  attempts.clear();
  accountWide.clear();
}
