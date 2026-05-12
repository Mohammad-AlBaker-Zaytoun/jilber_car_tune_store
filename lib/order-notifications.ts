/**
 * Order notification hooks.
 * TODO: wire up a real email provider (Resend, SendGrid, etc.) before production.
 * Each function is called after the relevant event; add email logic inside.
 */

import type { Order, OrderStatus } from '@/types/admin';

export function notifyOrderCreated(_order: Order): void {
  // TODO: send confirmation email to customer (_order.customer.email)
  // TODO: send new order alert to admin
}

export function notifyOrderStatusChanged(_order: Order, _newStatus: OrderStatus): void {
  // TODO: send status update email to customer
}

export function notifyOrderReadyForPickup(_order: Order): void {
  // TODO: send "your order is ready" email/SMS to customer
}

export function notifyOrderConfirmed(_order: Order): void {
  // TODO: send booking confirmation email with details
}

export function notifyOrderCancelled(_order: Order): void {
  // TODO: send cancellation notice to customer
}
