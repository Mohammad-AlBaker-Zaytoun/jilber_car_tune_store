import { describe, it, expect } from 'vitest';
import { safeRedirect } from '@/lib/auth';

describe('safeRedirect', () => {
  it('allows relative paths', () => {
    expect(safeRedirect('/account/orders')).toBe('/account/orders');
  });
  it('rejects absolute URLs (open redirect)', () => {
    expect(safeRedirect('https://evil.com')).toBe('/account');
  });
  it('rejects protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com')).toBe('/account');
  });
  it('uses the provided fallback', () => {
    expect(safeRedirect(null, '/signin')).toBe('/signin');
    expect(safeRedirect(undefined, '/signin')).toBe('/signin');
  });
});
