import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, User, Package, Store, CreditCard, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};
import { getSessionWithUser } from '@/lib/session';
import AccountShell from '@/components/account/AccountShell';
import VerifyEmailBanner from '@/components/account/VerifyEmailBanner';

export default async function AccountPage() {
  const resolved = await getSessionWithUser();
  if (!resolved) redirect('/signin?redirect=/account');
  const { session: user, user: account } = resolved;
  const emailVerified = Boolean(account.emailVerifiedAt);

  const quickLinks = [
    {
      href: '/account/profile',
      icon: User,
      label: 'Profile',
      desc: 'Manage your personal details',
      color: '#00d4ff',
    },
    {
      href: '/account/orders',
      icon: Package,
      label: 'Orders',
      desc: 'View your order history',
      color: '#a78bfa',
    },
    {
      href: '/cart',
      icon: ShoppingBag,
      label: 'Cart',
      desc: 'Review items in your cart',
      color: '#34d399',
    },
    {
      href: '/store',
      icon: Store,
      label: 'Store',
      desc: 'Browse performance parts',
      color: '#f59e0b',
    },
    {
      href: '/checkout',
      icon: CreditCard,
      label: 'Checkout',
      desc: 'Complete your order',
      color: '#f472b6',
    },
  ];

  return (
    <AccountShell user={user}>
      <div className="flex flex-col gap-6">
        {!emailVerified && <VerifyEmailBanner />}
        {/* Welcome banner */}
        <div className="border border-zinc-800/50 bg-zinc-900/20 p-7 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 w-64 h-64 opacity-5 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }}
          />
          <p className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold mb-2">
            Welcome Back
          </p>
          <h2 className="text-2xl font-black text-white">{user.name}</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Member since{' '}
            <span className="text-zinc-400">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </p>
        </div>

        {/* Quick links grid */}
        <div>
          <h3 className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-4">
            Quick Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {quickLinks.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 p-5 border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-700/80 transition-all duration-200 group"
              >
                <div
                  className="w-10 h-10 shrink-0 flex items-center justify-center border"
                  style={{
                    borderColor: `${color}30`,
                    background: `${color}10`,
                  }}
                >
                  <Icon size={16} style={{ color }} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">
                    {label}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{desc}</p>
                </div>
                <ChevronRight
                  size={12}
                  className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AccountShell>
  );
}
