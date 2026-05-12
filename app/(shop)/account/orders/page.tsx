import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AccountShell from '@/components/account/AccountShell';
import AccountOrdersClient from '@/components/account/orders/AccountOrdersClient';

export const metadata: Metadata = {
  title: 'Orders',
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await getSession();
  if (!user) redirect('/signin?redirect=/account/orders');

  return (
    <AccountShell user={user}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-1">
            Orders
          </h2>
          <p className="text-xs text-zinc-600">Your order history and service bookings</p>
        </div>
        <AccountOrdersClient />
      </div>
    </AccountShell>
  );
}
