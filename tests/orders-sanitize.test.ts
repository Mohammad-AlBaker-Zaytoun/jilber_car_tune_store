import { describe, it, expect } from 'vitest';
import { sanitizeOrderForCustomer, generateOrderRef } from '@/lib/orders.dev';
import type { Order } from '@/types/admin';

function makeOrder(): Order {
  return {
    id: 'o1',
    ref: 'TUNE-1',
    status: 'in_progress',
    paymentStatus: 'unpaid',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    userId: 'user-1',
    customer: { fullName: 'A', email: 'a@x.com', phone: '1', address: '' },
    vehicle: { make: 'BMW', model: 'M3', year: '2022', engine: '', currentMods: '', serviceDate: '' },
    items: [],
    payment: 'shop',
    subtotal: 100,
    tax: 10,
    total: 110,
    currency: 'USD',
    adminNotes: 'INTERNAL — do not expose',
    statusHistory: [
      { id: 'h1', orderId: 'o1', fromStatus: null, toStatus: 'pending', changedByUserId: 'user-1', changedByName: 'A', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'h2', orderId: 'o1', fromStatus: 'pending', toStatus: 'in_progress', changedByUserId: 'admin-9', changedByName: 'Boss Admin', createdAt: '2026-01-02T00:00:00.000Z' },
    ],
  };
}

describe('sanitizeOrderForCustomer', () => {
  it('strips adminNotes', () => {
    const safe = sanitizeOrderForCustomer(makeOrder(), 'user-1');
    expect('adminNotes' in safe).toBe(false);
  });

  it('keeps the customer\'s own history name but anonymises staff', () => {
    const safe = sanitizeOrderForCustomer(makeOrder(), 'user-1');
    expect(safe.statusHistory[0].changedByName).toBe('A'); // own entry
    expect(safe.statusHistory[1].changedByName).toBe('Workshop'); // staff hidden
    // staff user ids are never leaked
    expect(safe.statusHistory.every((h) => h.changedByUserId === '')).toBe(true);
  });
});

describe('generateOrderRef', () => {
  it('matches the TUNE-YYYYMMDD-XXXXX format', () => {
    expect(generateOrderRef()).toMatch(/^TUNE-\d{8}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
  });
  it('is unique across calls', () => {
    expect(generateOrderRef()).not.toBe(generateOrderRef());
  });
});
