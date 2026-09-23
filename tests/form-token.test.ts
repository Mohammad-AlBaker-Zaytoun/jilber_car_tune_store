import { describe, it, expect, beforeAll } from 'vitest';
import {
  createFormToken,
  verifyFormToken,
  MIN_AGE_MS,
  MAX_AGE_MS,
} from '@/lib/form-token';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-that-is-at-least-32-characters-long';
});

const AGED = (ms: number) => Date.now() - ms;

describe('form token', () => {
  it('accepts a token once the minimum age has passed', async () => {
    const token = await createFormToken(AGED(MIN_AGE_MS + 1000));
    expect(await verifyFormToken(token)).toBeNull();
  });

  /** The whole point: a script fills and submits in milliseconds. */
  it('rejects a submission faster than a human could type', async () => {
    const token = await createFormToken(Date.now());
    expect(await verifyFormToken(token)).toBe('too-fast');
  });

  it('rejects a token older than the window', async () => {
    const token = await createFormToken(AGED(MAX_AGE_MS + 60_000));
    expect(await verifyFormToken(token)).toBe('expired');
  });

  it('rejects a missing token — the direct-POST case', async () => {
    expect(await verifyFormToken(undefined)).toBe('missing');
    expect(await verifyFormToken('')).toBe('missing');
  });

  it('rejects garbage and tampered tokens', async () => {
    expect(await verifyFormToken('not-a-jwt')).toBe('invalid');
    const good = await createFormToken(AGED(MIN_AGE_MS + 1000));
    const [header, payload, signature] = good.split('.');
    /**
     * Alter the FIRST character of the signature, not the last.
     *
     * The signature is a 32-byte HMAC, which is 43 base64url characters: 43 x 6
     * = 258 bits carrying 256, so the final character's low two bits are
     * dropped on decode. Changing only that character leaves the signature
     * bytes untouched whenever the replacement shares its top four bits, which
     * is why the earlier version of this assertion passed or failed at random
     * depending on the timestamp baked into each run's token.
     */
    const tampered = [header, payload, (signature[0] === 'A' ? 'B' : 'A') + signature.slice(1)].join('.');
    expect(tampered).not.toBe(good);
    expect(await verifyFormToken(tampered)).toBe('invalid');
  });

  /**
   * A stamp from the future would otherwise pass the max-age check while
   * skipping the minimum entirely.
   */
  it('rejects a token stamped in the future', async () => {
    const token = await createFormToken(Date.now() + 60_000);
    expect(await verifyFormToken(token)).toBe('too-fast');
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await createFormToken(AGED(MIN_AGE_MS + 1000));
    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'a-completely-different-secret-value-32ch';
    const result = await verifyFormToken(token);
    process.env.AUTH_SECRET = original;
    expect(result).toBe('invalid');
  });

  it('is verifiable at the exact boundary', async () => {
    const now = Date.now();
    const token = await createFormToken(now - MIN_AGE_MS);
    expect(await verifyFormToken(token, now)).toBeNull();
  });
});
