import { describe, it, expect } from 'vitest';
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
  it('reads the first x-forwarded-for entry', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to unknown', () => {
    expect(getClientIp(new Request('http://x'))).toBe('unknown');
  });
});
