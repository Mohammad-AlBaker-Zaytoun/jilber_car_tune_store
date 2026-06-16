import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT } from 'jose';
import { createToken, verifyToken, type SessionUser } from '@/lib/auth';

// getSecret() reads AUTH_SECRET lazily at call time, so setting it here is enough.
beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
});

const base: SessionUser = {
  id: 'u1',
  email: 'a@b.com',
  name: 'Ada',
  role: 'user',
};

describe('token version claim', () => {
  it('round-trips the tokenVersion through create/verify', async () => {
    const token = await createToken({ ...base, tokenVersion: 7 });
    const session = await verifyToken(token);
    expect(session?.tokenVersion).toBe(7);
  });

  it('defaults to 0 when the SessionUser has no tokenVersion', async () => {
    const token = await createToken(base);
    const session = await verifyToken(token);
    expect(session?.tokenVersion).toBe(0);
  });

  it('defaults to 0 for a legacy token issued without the tv claim', async () => {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const legacy = await new SignJWT({ id: 'u1', email: 'a@b.com', name: 'Ada', role: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
    const session = await verifyToken(legacy);
    expect(session?.tokenVersion).toBe(0);
  });
});
