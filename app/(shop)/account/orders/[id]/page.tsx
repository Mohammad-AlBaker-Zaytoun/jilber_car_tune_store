import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrderById, sanitizeOrderForCustomer } from '@/lib/orders.dev';
import AccountShell from '@/components/account/AccountShell';
import AccountOrderDetailClient from '@/components/account/orders/AccountOrderDetailClient';

export const metadata: Metadata = {
  title: 'Order Details',
  robots: { index: false, follow: false },
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSession(), params]);
  if (!user) redirect('/signin?redirect=/account/orders');

  const order = await getOrderById(id);
  if (!order) notFound();

  // Security: users can only view their own orders (404 not 403 — avoids revealing order existence)
  if (order.userId !== user.id) notFound();

  const safeOrder = sanitizeOrderForCustomer(order, user.id);

  return (
    <AccountShell user={user}>
      <AccountOrderDetailClient order={safeOrder} />
    </AccountShell>
  );
}
