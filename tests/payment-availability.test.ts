import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import {
  isBreakerOpen,
  isCardPaymentAvailable,
  recordPaymentFailure,
  recordPaymentSuccess,
  __resetBreaker,
} from '@/lib/payments/whish-health';
import { createPayToken, verifyPayToken } from '@/lib/payments/pay-token';

/**
 * The store must keep taking orders when the gateway is unconfigured, down, or
 * erroring. These cover the two mechanisms that make that true: the breaker that
 * stops offering a broken payment method, and the signed link that lets a guest
 * pay a captured order later.
 */
describe('gateway circuit breaker', () => {
  const T0 = 1_000_000;

  beforeEach(() => {
    __resetBreaker();
    process.env.WHISH_CHANNEL = 'test-channel';
    process.env.WHISH_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.WHISH_CHANNEL;
    delete process.env.WHISH_SECRET;
  });

  it('stays closed below the threshold', () => {
    recordPaymentFailure(T0);
    recordPaymentFailure(T0);
    expect(isBreakerOpen(T0)).toBe(false);
    expect(isCardPaymentAvailable(T0)).toBe(true);
  });

  it('opens on the third consecutive failure', () => {
    for (let i = 0; i < 3; i++) recordPaymentFailure(T0);
    expect(isBreakerOpen(T0)).toBe(true);
    expect(isCardPaymentAvailable(T0)).toBe(false);
  });

  it('a success resets the count so near-misses do not accumulate forever', () => {
    recordPaymentFailure(T0);
    recordPaymentFailure(T0);
    recordPaymentSuccess(T0);
    recordPaymentFailure(T0);
    expect(isBreakerOpen(T0)).toBe(false);
  });

  it('closes again once the window elapses', () => {
    for (let i = 0; i < 3; i++) recordPaymentFailure(T0);
    expect(isBreakerOpen(T0 + 60_000)).toBe(true);
    expect(isBreakerOpen(T0 + 6 * 60_000)).toBe(false);
  });

  it('a success closes it early', () => {
    for (let i = 0; i < 3; i++) recordPaymentFailure(T0);
    expect(isBreakerOpen(T0)).toBe(true);
    recordPaymentSuccess(T0);
    expect(isBreakerOpen(T0)).toBe(false);
    expect(isCardPaymentAvailable(T0)).toBe(true);
  });

  it('can reopen after recovering', () => {
    for (let i = 0; i < 3; i++) recordPaymentFailure(T0);
    recordPaymentSuccess(T0);
    for (let i = 0; i < 3; i++) recordPaymentFailure(T0 + 1000);
    expect(isBreakerOpen(T0 + 1000)).toBe(true);
  });

  it('reports unavailable when credentials are missing, breaker aside', () => {
    delete process.env.WHISH_CHANNEL;
    delete process.env.WHISH_SECRET;
    expect(isBreakerOpen(T0)).toBe(false);
    // "Not configured" and "configured but failing" are different causes with
    // the same correct answer for the customer.
    expect(isCardPaymentAvailable(T0)).toBe(false);
  });
});

describe('pay token', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'test-secret-at-least-32-characters-long!!';
  });

  it('round-trips the order id', async () => {
    const token = await createPayToken('order-123');
    expect(await verifyPayToken(token)).toBe('order-123');
  });

  it('rejects a tampered signature', async () => {
    const token = await createPayToken('order-123');
    const parts = token.split('.');
    expect(await verifyPayToken(`${parts[0]}.${parts[1]}.deadbeef`)).toBeNull();
  });

  it('rejects garbage', async () => {
    expect(await verifyPayToken('not-a-token')).toBeNull();
    expect(await verifyPayToken('')).toBeNull();
  });

  // A session cookie is signed with the SAME secret, so without the purpose
  // claim it could be replayed as a pay token (and vice versa).
  it('rejects a token signed for a different purpose', async () => {
    const { createToken } = await import('@/lib/auth');
    const sessionToken = await createToken({
      id: 'u1',
      email: 'a@example.com',
      name: 'A',
      role: 'user',
    });
    expect(await verifyPayToken(sessionToken)).toBeNull();
  });

  it('is bound to one order — the id comes from the token, never the caller', async () => {
    const a = await createPayToken('order-aaa');
    const b = await createPayToken('order-bbb');
    expect(await verifyPayToken(a)).toBe('order-aaa');
    expect(await verifyPayToken(b)).toBe('order-bbb');
    expect(await verifyPayToken(a)).not.toBe('order-bbb');
  });
});
