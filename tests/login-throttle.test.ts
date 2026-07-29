import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
  __resetLoginThrottle,
} from '@/lib/login-throttle';

/**
 * Login throttling, keyed on (account, source IP).
 *
 * IP-only limiting does not stop credential stuffing against a known address.
 * Account-only limiting is worse: it is a remote denial-of-service primitive,
 * because the lockout is evaluated before the password is checked, so anyone
 * who knows an address can lock its real owner out indefinitely.
 */
describe('login throttle', () => {
  beforeEach(() => __resetLoginThrottle());

  const EMAIL = 'victim@example.com';
  const ATTACKER = '198.51.100.7';
  const OWNER = '203.0.113.42';

  const failNTimes = (n: number, ip: string, email = EMAIL) => {
    let last;
    for (let i = 0; i < n; i++) last = recordLoginFailure(email, ip);
    return last!;
  };

  it('allows attempts below the threshold', () => {
    failNTimes(7, ATTACKER);
    expect(checkLoginThrottle(EMAIL, ATTACKER).locked).toBe(false);
  });

  it('locks the source once the threshold is reached', () => {
    const state = failNTimes(8, ATTACKER);
    expect(state.locked).toBe(true);
    expect(state.retryAfter).toBeGreaterThan(0);
    expect(checkLoginThrottle(EMAIL, ATTACKER).locked).toBe(true);
  });

  // THE REASON THIS IS KEYED ON IP. An account-only key let an attacker lock out
  // the legitimate owner — including the admin — with a few requests per hour.
  it('does NOT lock the real owner when an attacker floods from another IP', () => {
    failNTimes(40, ATTACKER);
    expect(checkLoginThrottle(EMAIL, ATTACKER).locked).toBe(true);
    expect(checkLoginThrottle(EMAIL, OWNER).locked).toBe(false);
  });

  it('is scoped per account as well as per source', () => {
    failNTimes(8, ATTACKER);
    expect(checkLoginThrottle(EMAIL, ATTACKER).locked).toBe(true);
    expect(checkLoginThrottle('someone-else@example.com', ATTACKER).locked).toBe(false);
  });

  it('normalises case and surrounding whitespace', () => {
    failNTimes(8, ATTACKER);
    expect(checkLoginThrottle('  VICTIM@EXAMPLE.COM ', ATTACKER).locked).toBe(true);
  });

  it('backs off further on continued failures', () => {
    failNTimes(8, ATTACKER);
    const first = checkLoginThrottle(EMAIL, ATTACKER).retryAfter;
    const second = recordLoginFailure(EMAIL, ATTACKER).retryAfter;
    expect(second).toBeGreaterThan(first);
  });

  it('caps the lockout so a source is never blocked indefinitely', () => {
    failNTimes(40, ATTACKER);
    expect(checkLoginThrottle(EMAIL, ATTACKER).retryAfter).toBeLessThanOrEqual(15 * 60);
  });

  it('clears that source after a successful login', () => {
    failNTimes(8, ATTACKER);
    expect(checkLoginThrottle(EMAIL, ATTACKER).locked).toBe(true);
    clearLoginFailures(EMAIL, ATTACKER);
    expect(checkLoginThrottle(EMAIL, ATTACKER).locked).toBe(false);
  });

  it('releases the lock once the window passes', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 8; i++) recordLoginFailure(EMAIL, ATTACKER, t0);
    expect(checkLoginThrottle(EMAIL, ATTACKER, t0).locked).toBe(true);
    expect(checkLoginThrottle(EMAIL, ATTACKER, t0 + 16 * 60_000).locked).toBe(false);
  });

  it('flags a distributed attack without denying anyone', () => {
    // 25 failures for one account, each from a different source: no single
    // source is locked, but the pattern must still be visible to the operator.
    let flagged = false;
    for (let i = 0; i < 25; i++) {
      const state = recordLoginFailure(EMAIL, `198.51.100.${i}`);
      if (state.distributedAttack) flagged = true;
      expect(state.locked).toBe(false);
    }
    expect(flagged).toBe(true);
  });
});
