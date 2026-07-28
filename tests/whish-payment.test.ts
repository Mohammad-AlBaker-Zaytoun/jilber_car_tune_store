import { describe, it, expect } from 'vitest';
import type { StatusResponse } from 'whish-pay';
import { shouldMarkPaid, toWhishCurrency } from '@/lib/payments/whish';

function status(over: Partial<StatusResponse>): StatusResponse {
  return { collectStatus: 'success', amount: 100, currency: 'USD', ...over };
}

describe('shouldMarkPaid', () => {
  it('marks paid when collection succeeded and amount matches', () => {
    expect(shouldMarkPaid(status({}), 100, 'USD')).toBe(true);
  });

  it('allows tiny rounding differences within the currency tolerance', () => {
    expect(shouldMarkPaid(status({ amount: 99.99 }), 100, 'USD')).toBe(true);
  });

  it('rejects a failed collection', () => {
    expect(shouldMarkPaid(status({ collectStatus: 'failed' }), 100, 'USD')).toBe(false);
  });

  it('rejects a pending collection', () => {
    expect(shouldMarkPaid(status({ collectStatus: 'pending' }), 100, 'USD')).toBe(false);
  });

  it('rejects an underpaid amount', () => {
    expect(shouldMarkPaid(status({ amount: 90 }), 100, 'USD')).toBe(false);
  });

  it('rejects when the amount is missing', () => {
    expect(shouldMarkPaid(status({ amount: undefined }), 100, 'USD')).toBe(false);
  });

  it('rejects an unsupported currency', () => {
    expect(shouldMarkPaid(status({}), 100, 'EUR')).toBe(false);
  });
});

describe('toWhishCurrency', () => {
  it('passes through supported currencies', () => {
    expect(toWhishCurrency('USD')).toBe('USD');
    expect(toWhishCurrency('LBP')).toBe('LBP');
    expect(toWhishCurrency('AED')).toBe('AED');
  });

  // Regression: this used to fall back to USD, which combined with
  // shouldMarkPaid() rejecting the same currency meant an EUR order was CHARGED
  // as USD and then never marked paid — money taken, no order record, no email.
  // Refusing to start the payment is the only safe behaviour.
  it('throws rather than silently charging an unsupported currency as USD', () => {
    expect(() => toWhishCurrency('EUR')).toThrow(/refusing to charge/i);
    expect(() => toWhishCurrency('')).toThrow(/refusing to charge/i);
  });

  it('never disagrees with shouldMarkPaid about what is chargeable', () => {
    // Any currency toWhishCurrency accepts must also be one shouldMarkPaid can
    // confirm — otherwise the charge/confirm pair can diverge again.
    for (const currency of ['USD', 'LBP', 'AED']) {
      expect(toWhishCurrency(currency)).toBe(currency);
      expect(shouldMarkPaid(status({ currency }), 100, currency)).toBe(true);
    }
  });
});
