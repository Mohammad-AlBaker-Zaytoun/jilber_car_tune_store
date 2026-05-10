import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, Store } from 'lucide-react';
import { getSession } from '@/lib/session';
import AccountShell from '@/components/account/AccountShell';

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
          <p className="text-xs text-zinc-600">Your order history</p>
        </div>

        {/* Empty state */}
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center text-center py-20 px-8">
          <div className="w-16 h-16 flex items-center justify-center border border-zinc-800 bg-zinc-900/40 mb-6">
            <Package size={24} className="text-zinc-600" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black text-white mb-2">No orders yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
            When you complete a checkout, your order will appear here. Explore our store to find
            your next performance upgrade.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
          >
            <Store size={13} aria-hidden="true" />
            Browse Store
          </Link>
        </div>
      </div>
    </AccountShell>
  );
}
