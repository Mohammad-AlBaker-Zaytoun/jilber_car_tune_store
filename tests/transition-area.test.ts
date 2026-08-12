import { describe, it, expect } from 'vitest';
import { isLightTransitionArea } from '@/lib/transition/isInternalNavigation';

/**
 * Which routes get the light fade instead of the 72-frame cinematic sequence.
 *
 * This is the whole rule behind "the admin panel does not play the storefront
 * animation". It is a plain string predicate with no DOM involved, so it is
 * worth pinning: the failure mode is silent — the admin panel simply becomes
 * slow and downloads 5.4 MB of frames again, with nothing erroring.
 */
describe('isLightTransitionArea', () => {
  it('matches the admin root', () => {
    expect(isLightTransitionArea('/admin')).toBe(true);
  });

  it('matches nested admin routes', () => {
    for (const p of [
      '/admin/orders',
      '/admin/orders/abc-123',
      '/admin/products',
      '/admin/settings',
    ]) {
      expect(isLightTransitionArea(p), p).toBe(true);
    }
  });

  it('leaves storefront routes on the cinematic transition', () => {
    for (const p of ['/', '/store', '/store/stage-1-ecu-remap', '/cart', '/checkout', '/contact']) {
      expect(isLightTransitionArea(p), p).toBe(false);
    }
  });

  it('does not match routes that merely start with the same letters', () => {
    // A prefix check written as a bare startsWith('/admin') would wrongly claim
    // these, quietly downgrading real storefront pages.
    for (const p of ['/administration', '/admin-tools', '/adminish']) {
      expect(isLightTransitionArea(p), p).toBe(false);
    }
  });

  it('does not match an unrelated route that contains "admin" later on', () => {
    expect(isLightTransitionArea('/store/admin-edition-wheels')).toBe(false);
  });
});
