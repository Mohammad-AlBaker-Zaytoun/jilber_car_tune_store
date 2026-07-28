import { describe, it, expect } from 'vitest';
import {
  STORE_CURRENCY,
  computeTotals,
  formatMoney,
  round2,
} from '@/lib/currency';

/**
 * The order-total arithmetic had no test coverage at all, despite being the code
 * that decides what a customer is charged. computeTotals() is now the single
 * implementation shared by the cart display and POST /api/orders, so these tests
 * pin down both at once.
 */
describe('computeTotals', () => {
  it('applies the given rate rather than a hardcoded 10%', () => {
    // Regression: the cart hardcoded 0.1 while the server used settings.taxRate,
    // so a 15% shop displayed a 10% total and then charged 15%.
    expect(computeTotals(100, 15)).toEqual({ subtotal: 100, tax: 15, total: 115 });
    expect(computeTotals(100, 10)).toEqual({ subtotal: 100, tax: 10, total: 110 });
    expect(computeTotals(100, 0)).toEqual({ subtotal: 100, tax: 0, total: 100 });
  });

  it('clamps the rate to 0-100', () => {
    expect(computeTotals(100, -5).tax).toBe(0);
    expect(computeTotals(100, 250).tax).toBe(100);
  });

  it('rounds tax and total to 2dp', () => {
    const { tax, total } = computeTotals(19.99, 8.25);
    expect(tax).toBe(1.65);
    expect(total).toBe(21.64);
    // No floating-point dust anywhere in the result.
    expect(Number.isInteger(Math.round(total * 100))).toBe(true);
  });

  it('handles a fractional rate', () => {
    expect(computeTotals(200, 8.5)).toEqual({ subtotal: 200, tax: 17, total: 217 });
  });

  it('is stable for an empty cart', () => {
    expect(computeTotals(0, 10)).toEqual({ subtotal: 0, tax: 0, total: 0 });
  });

  it('rounds the incoming subtotal before taxing it', () => {
    // 3 items at 33.333 would otherwise carry float dust into the total.
    const { subtotal, total } = computeTotals(33.333 * 3, 10);
    expect(subtotal).toBe(100);
    expect(total).toBe(110);
  });
});

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.005)).toBe(1.0); // documents the binary-float edge, not a wish
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10)).toBe(10);
  });
});

describe('formatMoney', () => {
  it('formats with an explicit locale so SSR and client agree', () => {
    // A bare toLocaleString() renders differently on the VPS than in the browser
    // and produces a hydration mismatch on every price.
    expect(formatMoney(1234.5)).toBe('$1,234.50');
    expect(formatMoney(0)).toBe('$0.00');
  });
});

describe('STORE_CURRENCY', () => {
  it('is USD', () => {
    expect(STORE_CURRENCY).toBe('USD');
  });
});
