import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
  __resetLoginThrottle,
} from '@/lib/login-throttle';

/**
 * Per-account login throttling. IP-based limiting alone does not stop credential
 * stuffing against a known email — every bot in a pool gets its own IP budget.
 */
describe('login throttle', () => {
  beforeEach(() => __resetLoginThrottle());

  const EMAIL = 'victim@example.com';

  it('allows attempts below the threshold', () => {
    for (let i = 0; i < 7; i++) {
      expect(recordLoginFailure(EMAIL).locked).toBe(false);
    }
    expect(checkLoginThrottle(EMAIL).locked).toBe(false);
  });

  it('locks the account once the threshold is reached', () => {
    for (let i = 0; i < 7; i++) recordLoginFailure(EMAIL);
    const state = recordLoginFailure(EMAIL); // 8th
    expect(state.locked).toBe(true);
    expect(state.retryAfter).toBeGreaterThan(0);
    expect(checkLoginThrottle(EMAIL).locked).toBe(true);
  });

  it('is keyed per account, not globally', () => {
    for (let i = 0; i < 8; i++) recordLoginFailure(EMAIL);
    expect(checkLoginThrottle(EMAIL).locked).toBe(true);
    expect(checkLoginThrottle('someone-else@example.com').locked).toBe(false);
  });

  it('normalises case and surrounding whitespace', () => {
    // Otherwise "Victim@Example.com " would get its own fresh budget.
    for (let i = 0; i < 8; i++) recordLoginFailure(EMAIL);
    expect(checkLoginThrottle('  VICTIM@EXAMPLE.COM ').locked).toBe(true);
  });

  it('backs off further on continued failures', () => {
    for (let i = 0; i < 8; i++) recordLoginFailure(EMAIL);
    const first = checkLoginThrottle(EMAIL).retryAfter;
    const second = recordLoginFailure(EMAIL).retryAfter;
    expect(second).toBeGreaterThan(first);
  });

  it('caps the lockout so a user is never locked out indefinitely', () => {
    for (let i = 0; i < 40; i++) recordLoginFailure(EMAIL);
    expect(checkLoginThrottle(EMAIL).retryAfter).toBeLessThanOrEqual(15 * 60);
  });

  it('clears the counter after a successful login', () => {
    for (let i = 0; i < 8; i++) recordLoginFailure(EMAIL);
    expect(checkLoginThrottle(EMAIL).locked).toBe(true);
    clearLoginFailures(EMAIL);
    expect(checkLoginThrottle(EMAIL).locked).toBe(false);
  });

  it('releases the lock once the window passes', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 8; i++) recordLoginFailure(EMAIL, t0);
    expect(checkLoginThrottle(EMAIL, t0).locked).toBe(true);
    // Past the maximum lockout.
    expect(checkLoginThrottle(EMAIL, t0 + 16 * 60_000).locked).toBe(false);
  });
});
