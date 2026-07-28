import { describe, it, expect } from 'vitest';
import { sniffImageType } from '@/app/api/admin/upload/product-image/route';

/**
 * The upload handler used to trust the client-supplied multipart MIME type,
 * which is what picked the extension the file was stored under. Magic-byte
 * sniffing means a disguised payload cannot be written with an image extension.
 */
const bytes = (...b: number[]) => new Uint8Array(b);
const ascii = (text: string, pad = 0) => {
  const out = new Uint8Array(pad + text.length);
  for (let i = 0; i < text.length; i++) out[pad + i] = text.charCodeAt(i);
  return out;
};
const concat = (...parts: Uint8Array[]) => {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

describe('sniffImageType', () => {
  it('detects JPEG', () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe(
      'image/png'
    );
  });

  it('detects WebP (RIFF….WEBP)', () => {
    const webp = concat(ascii('RIFF'), bytes(0, 0, 0, 0), ascii('WEBP'));
    expect(sniffImageType(webp)).toBe('image/webp');
  });

  it('detects AVIF', () => {
    const avif = concat(bytes(0, 0, 0, 0x20), ascii('ftyp'), ascii('avif'));
    expect(sniffImageType(avif)).toBe('image/avif');
  });

  it('rejects SVG — scriptable, deliberately not in the allowlist', () => {
    expect(sniffImageType(ascii('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
  });

  it('rejects HTML disguised with an image content-type', () => {
    expect(sniffImageType(ascii('<!DOCTYPE html><script>alert(1)</script>'))).toBeNull();
  });

  it('rejects a PHP/script payload', () => {
    expect(sniffImageType(ascii('<?php system($_GET["c"]); ?>'))).toBeNull();
  });

  it('rejects a RIFF container that is not WEBP (e.g. a .wav)', () => {
    const wav = concat(ascii('RIFF'), bytes(0, 0, 0, 0), ascii('WAVE'));
    expect(sniffImageType(wav)).toBeNull();
  });

  it('rejects empty and truncated input without throwing', () => {
    expect(sniffImageType(new Uint8Array(0))).toBeNull();
    expect(sniffImageType(bytes(0xff))).toBeNull();
    expect(sniffImageType(bytes(0x89, 0x50))).toBeNull();
  });
});
