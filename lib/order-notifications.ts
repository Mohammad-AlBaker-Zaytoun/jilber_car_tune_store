/**
 * Order notification hooks. Sends email via lib/email (env-gated by RESEND_API_KEY).
 * Callers fire-and-forget — these never throw.
 */

import type { Order, OrderStatus } from '@/types/admin';
import { sendEmail, adminEmail, emailLayout, escapeHtml } from '@/lib/email';
import { formatStatus } from '@/components/admin/orderStatus';

function orderSummary(order: Order): string {
  const lines = order.items
    .map((i) => `<li>${i.quantity}× ${escapeHtml(i.name)}</li>`)
    .join('');
  return `<p>Reference: <strong>${escapeHtml(order.ref)}</strong></p>
    <p>Vehicle: ${escapeHtml(order.vehicle.make)} ${escapeHtml(order.vehicle.model)} (${escapeHtml(order.vehicle.year)})</p>
    <ul>${lines}</ul>
    <p>Total: <strong>${escapeHtml(order.currency)} ${order.total.toFixed(2)}</strong></p>`;
}

export async function notifyOrderCreated(order: Order): Promise<void> {
  await sendEmail({
    to: order.customer.email,
    subject: `Order received — ${order.ref}`,
    html: emailLayout(
      'Thanks for your booking',
      `<p>Hi ${escapeHtml(order.customer.fullName)}, we've received your order and will be in touch shortly.</p>${orderSummary(order)}`
    ),
  });

  const admin = adminEmail();
  if (admin) {
    await sendEmail({
      to: admin,
      subject: `New order — ${order.ref}`,
      html: emailLayout(
        'New order placed',
        `<p>${escapeHtml(order.customer.fullName)} (${escapeHtml(order.customer.email)}, ${escapeHtml(order.customer.phone)})</p>${orderSummary(order)}`
      ),
    });
  }
}

async function notifyCustomerStatus(order: Order, heading: string, message: string): Promise<void> {
  await sendEmail({
    to: order.customer.email,
    subject: `Order ${order.ref} — ${formatStatus(order.status)}`,
    html: emailLayout(heading, `<p>${message}</p><p>Reference: <strong>${order.ref}</strong></p>`),
  });
}

export async function notifyOrderStatusChanged(order: Order, newStatus: OrderStatus): Promise<void> {
  await notifyCustomerStatus(
    order,
    'Order update',
    `Your order status is now <strong>${formatStatus(newStatus)}</strong>.`
  );
}

export async function notifyOrderReadyForPickup(order: Order): Promise<void> {
  await notifyCustomerStatus(order, 'Your vehicle is ready', 'Your order is ready for pickup.');
}

export async function notifyOrderConfirmed(order: Order): Promise<void> {
  await notifyCustomerStatus(order, 'Booking confirmed', 'Your booking has been confirmed.');
}

export async function notifyOrderCancelled(order: Order): Promise<void> {
  await notifyCustomerStatus(order, 'Order cancelled', 'Your order has been cancelled.');
}
