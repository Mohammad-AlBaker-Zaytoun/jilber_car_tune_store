import type { OrderStatus } from '@/types/admin';

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  confirmed: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  'in-progress': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  completed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/5',
};

export const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'in-progress',
  'completed',
  'cancelled',
];

export function formatStatus(s: OrderStatus): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
