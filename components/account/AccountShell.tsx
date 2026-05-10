'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Package, ShoppingCart, Store, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { SessionUser } from '@/lib/session';

const NAV = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/account/profile', label: 'Profile', icon: User, exact: false },
  { href: '/account/orders', label: 'Orders', icon: Package, exact: false },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, exact: false },
  { href: '/store', label: 'Store', icon: Store, exact: false },
];

interface Props {
  user: SessionUser;
  children: React.ReactNode;
}

export default function AccountShell({ user, children }: Props) {
  const pathname = usePathname();
  const { signOut, user: authUser } = useAuth();

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-zinc-950 pt-28 lg:pt-32 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              My Account
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            DASHBOARD
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-10">
          {/* Sidebar */}
          <aside className="flex flex-col gap-2">
            {/* Avatar card */}
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-5 flex items-center gap-4 mb-2">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
                <span className="text-base font-black text-cyan-400">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-0.5" aria-label="Account navigation">
              {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wide transition-all duration-200 ${
                      active
                        ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent'
                    }`}
                  >
                    <Icon size={13} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {authUser?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/5 border border-cyan-400/20 transition-all duration-200"
              >
                <Shield size={13} aria-hidden="true" />
                Admin Panel
              </Link>
            )}

            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 mt-2 text-xs font-semibold text-zinc-600 hover:text-red-400 hover:bg-zinc-900/40 border border-transparent transition-all duration-200 text-left"
            >
              <LogOut size={13} aria-hidden="true" />
              Sign Out
            </button>
          </aside>

          {/* Main content */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
