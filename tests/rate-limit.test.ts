import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows requests up to the limit then blocks', () => {
    const key = 'test:' + Math.random();
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('keeps separate counters per key', () => {
    const a = 'a:' + Math.random();
    const b = 'b:' + Math.random();
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });

  it('resets after the window elapses', () => {
    const key = 'win:' + Math.random();
    expect(rateLimit(key, 1, 1).ok).toBe(true); // 1ms window
    const start = Date.now();
    while (Date.now() - start < 5) { /* spin past the window */ }
    expect(rateLimit(key, 1, 1).ok).toBe(true);
  });
});

describe('getClientIp', () => {
  const withXff = (value: string) =>
    new Request('http://x', { headers: { 'x-forwarded-for': value } });

  beforeEach(() => {
    delete process.env.TRUSTED_PROXY_COUNT; // default: 1 proxy (nginx)
  });

  it('takes the entry our own proxy appended, not the client-supplied one', () => {
    // Regression: this used to read parts[0], which is whatever the CLIENT sent.
    // An attacker rotating that value defeated every rate limit in the app.
    expect(getClientIp(withXff('9.9.9.9, 203.0.113.5'))).toBe('203.0.113.5');
  });

  it('cannot be spoofed by padding the header with fake hops', () => {
    const spoofed = getClientIp(withXff('1.1.1.1, 2.2.2.2, 3.3.3.3, 203.0.113.5'));
    expect(spoofed).toBe('203.0.113.5');
  });

  it('gives a rotating attacker the SAME bucket key every time', () => {
    // The actual security property: vary the forged prefix however you like, the
    // resolved key does not move, so the limiter still counts you.
    const keys = new Set(
      ['9.9.9.9', 'a, b', '', '1.2.3.4, 5.6.7.8'].map((forged) =>
        getClientIp(withXff(`${forged}${forged ? ', ' : ''}203.0.113.5`))
      )
    );
    expect(keys).toEqual(new Set(['203.0.113.5']));
  });

  it('handles a proxy that overwrites rather than appends', () => {
    // deploy/nginx.conf sets XFF to $remote_addr, giving a single entry.
    expect(getClientIp(withXff('203.0.113.5'))).toBe('203.0.113.5');
  });

  it('honours TRUSTED_PROXY_COUNT for a longer chain', () => {
    process.env.TRUSTED_PROXY_COUNT = '2'; // e.g. Cloudflare -> nginx -> app
    expect(getClientIp(withXff('9.9.9.9, 203.0.113.5, 10.0.0.1'))).toBe('203.0.113.5');
  });

  it('ignores forwarding headers entirely when no proxy is trusted', () => {
    process.env.TRUSTED_PROXY_COUNT = '0';
    expect(getClientIp(withXff('9.9.9.9'))).toBe('direct');
  });

  it('rejects non-IP values rather than keying on garbage', () => {
    expect(getClientIp(withXff('not-an-ip'))).toBe('unknown');
  });

  it('falls back to x-real-ip, then unknown', () => {
    const req = new Request('http://x', { headers: { 'x-real-ip': '203.0.113.9' } });
    expect(getClientIp(req)).toBe('203.0.113.9');
    expect(getClientIp(new Request('http://x'))).toBe('unknown');
  });

  it('supports IPv6', () => {
    expect(getClientIp(withXff('2001:db8::1'))).toBe('2001:db8::1');
  });
});
