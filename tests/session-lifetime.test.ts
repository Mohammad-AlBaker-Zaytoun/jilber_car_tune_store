import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { createToken, verifyToken, type SessionUser } from '@/lib/auth';

/**
 * Absolute session lifetime.
 *
 * The proxy re-issues a fresh 24h cookie on every authenticated page view, so a
 * session in daily use never expired — a stolen cookie stayed valid forever as
 * long as it kept being used. The `sat` (session-started-at) claim is carried
 * unchanged across renewals and enforces a hard ceiling.
 */
const USER: SessionUser = {
  id: 'u1',
  email: 'a@example.com',
  name: 'A',
  role: 'user',
  tokenVersion: 0,
};

const DAY = 24 * 60 * 60;

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-at-least-32-characters-long!!';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('absolute session lifetime', () => {
  it('stamps sessionStartedAt on a fresh sign-in', async () => {
    const session = await verifyToken(await createToken(USER));
    expect(session?.sessionStartedAt).toBeTypeOf('number');
  });

  it('preserves sessionStartedAt across renewal — the ceiling must not slide', async () => {
    const original = await verifyToken(await createToken(USER));
    const sat = original!.sessionStartedAt!;

    // Simulate the proxy renewing the cookie on a later page view.
    const renewed = await verifyToken(await createToken(original!));
    expect(renewed?.sessionStartedAt).toBe(sat);
  });

  it('accepts a session inside the 7-day window', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = await createToken({ ...USER, sessionStartedAt: nowSeconds - 6 * DAY });
    expect(await verifyToken(token)).not.toBeNull();
  });

  it('rejects a session past the 7-day ceiling even though the JWT is unexpired', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    // 8 days old. setExpirationTime('24h') is measured from issue time, so this
    // token is cryptographically valid — only the sat check rejects it.
    const token = await createToken({ ...USER, sessionStartedAt: nowSeconds - 8 * DAY });
    expect(await verifyToken(token)).toBeNull();
  });

  it('does not reject tokens issued before the claim existed', async () => {
    // Backwards compatibility: a live session without `sat` must keep working
    // rather than logging every user out on deploy.
    const legacy = await createToken(USER);
    const decoded = await verifyToken(legacy);
    expect(decoded).not.toBeNull();
  });

  it('still carries tokenVersion, so password-change revocation is unaffected', async () => {
    const session = await verifyToken(await createToken({ ...USER, tokenVersion: 7 }));
    expect(session?.tokenVersion).toBe(7);
  });
});
