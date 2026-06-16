import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/lib/email';

describe('escapeHtml', () => {
  it('neutralises a script-injection attempt', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });

  it('escapes all five HTML-sensitive characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Jane Doe')).toBe('Jane Doe');
  });

  it('coerces null/undefined to an empty string', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
