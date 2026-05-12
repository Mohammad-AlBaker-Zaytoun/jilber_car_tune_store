import type { OrderStatus, PaymentStatus } from '@/types/admin';

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:          'text-amber-400 border-amber-400/30 bg-amber-400/5',
  confirmed:        'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  awaiting_vehicle: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  in_progress:      'text-blue-400 border-blue-400/30 bg-blue-400/5',
  ready_for_pickup: 'text-teal-400 border-teal-400/30 bg-teal-400/5',
  completed:        'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  cancelled:        'text-red-400 border-red-400/30 bg-red-400/5',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid:          'text-red-400 border-red-400/30 bg-red-400/5',
  deposit_pending: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  deposit_paid:    'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  paid:            'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  refunded:        'text-zinc-400 border-zinc-400/30 bg-zinc-400/5',
  not_required:    'text-zinc-600 border-zinc-700/30 bg-zinc-900/20',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  awaiting_vehicle: 'Awaiting Vehicle',
  in_progress:      'In Progress',
  ready_for_pickup: 'Ready for Pickup',
  completed:        'Completed',
  cancelled:        'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid:          'Unpaid',
  deposit_pending: 'Deposit Pending',
  deposit_paid:    'Deposit Paid',
  paid:            'Paid',
  refunded:        'Refunded',
  not_required:    'N/A',
};

export const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'awaiting_vehicle',
  'in_progress',
  'ready_for_pickup',
  'completed',
  'cancelled',
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'unpaid',
  'deposit_pending',
  'deposit_paid',
  'paid',
  'refunded',
  'not_required',
];

// Which statuses are reachable from a given status
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['awaiting_vehicle', 'in_progress', 'cancelled'],
  awaiting_vehicle: ['in_progress', 'cancelled'],
  in_progress:      ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['completed', 'in_progress'],
  completed:        [],
  cancelled:        [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function formatStatus(s: OrderStatus): string {
  return STATUS_LABELS[s] ?? s;
}

export function formatPaymentStatus(s: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS[s] ?? s;
}
