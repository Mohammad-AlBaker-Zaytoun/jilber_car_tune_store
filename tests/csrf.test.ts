import { describe, it, expect } from 'vitest';
import type { NextRequest } from 'next/server';
import { isSameOriginRequest } from '@/lib/csrf';

/**
 * Minimal NextRequest stand-in: isSameOriginRequest only reads `method`,
 * `nextUrl.host`, and the `origin`/`referer` headers.
 */
function mockRequest(opts: {
  method?: string;
  host?: string;
  origin?: string;
  referer?: string;
}): NextRequest {
  const { method = 'POST', host = 'shop.example.com', origin, referer } = opts;
  const headers = new Map<string, string>();
  if (origin !== undefined) headers.set('origin', origin);
  if (referer !== undefined) headers.set('referer', referer);
  return {
    method,
    nextUrl: { host },
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
  } as unknown as NextRequest;
}

describe('isSameOriginRequest', () => {
  it('allows read-only methods regardless of origin', () => {
    expect(isSameOriginRequest(mockRequest({ method: 'GET', origin: 'https://evil.com' }))).toBe(true);
    expect(isSameOriginRequest(mockRequest({ method: 'HEAD' }))).toBe(true);
  });

  it('allows same-origin mutations via Origin header', () => {
    expect(
      isSameOriginRequest(mockRequest({ method: 'POST', host: 'shop.example.com', origin: 'https://shop.example.com' }))
    ).toBe(true);
  });

  it('blocks cross-origin mutations via Origin header', () => {
    expect(
      isSameOriginRequest(mockRequest({ method: 'POST', host: 'shop.example.com', origin: 'https://evil.com' }))
    ).toBe(false);
  });

  it('falls back to Referer when Origin is absent', () => {
    expect(
      isSameOriginRequest(mockRequest({ method: 'PUT', host: 'shop.example.com', referer: 'https://shop.example.com/checkout' }))
    ).toBe(true);
    expect(
      isSameOriginRequest(mockRequest({ method: 'PUT', host: 'shop.example.com', referer: 'https://evil.com/x' }))
    ).toBe(false);
  });

  it('blocks mutations with neither Origin nor Referer', () => {
    expect(isSameOriginRequest(mockRequest({ method: 'DELETE' }))).toBe(false);
  });

  it('blocks malformed Origin values', () => {
    expect(isSameOriginRequest(mockRequest({ method: 'POST', origin: 'not-a-url' }))).toBe(false);
  });
});
