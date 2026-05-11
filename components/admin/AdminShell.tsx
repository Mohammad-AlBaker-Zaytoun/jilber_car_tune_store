'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  ShoppingBag,
  Settings,
  Gauge,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { SessionUser } from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package, exact: false },
  { href: '/admin/categories', label: 'Categories', icon: Tag, exact: false },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
];

interface SidebarProps {
  user: SessionUser;
  pathname: string;
  onNavClick: () => void;
  onSignOut: () => void;
  closeButton?: React.ReactNode;
}

function AdminSidebar({ user, pathname, onNavClick, onSignOut, closeButton }: SidebarProps) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 shrink-0">
            <Gauge className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-[0.2em] text-white uppercase">JILBER</span>
            <span className="text-[9px] text-cyan-400/60 tracking-widest font-medium uppercase flex items-center gap-1">
              <Shield size={8} aria-hidden="true" />
              Admin
            </span>
          </div>
        </div>
        {closeButton}
      </div>

      {/* User card */}
      <div className="mx-3 mt-4 mb-2 p-3 border border-zinc-800/50 bg-zinc-900/30 flex items-center gap-3">
        <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
          <span className="text-[10px] font-black text-cyan-400">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-white truncate">{user.name}</p>
          <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 mt-2 flex-1" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                active
                  ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
              {active && (
                <ChevronRight size={10} className="ml-auto opacity-50" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-5 mt-4 flex flex-col gap-0.5 border-t border-zinc-800/50 pt-3">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/40 border border-transparent transition-all duration-200"
        >
          <Gauge size={13} aria-hidden="true" />
          View Site
        </Link>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:text-red-400 hover:bg-zinc-900/40 border border-transparent transition-all duration-200 text-left"
        >
          <LogOut size={13} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </>
  );
}

interface Props {
  user: SessionUser;
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop sidebar — always visible, never re-mounts */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-950 fixed top-0 left-0 bottom-0 z-40">
        <AdminSidebar
          user={user}
          pathname={pathname}
          onNavClick={closeSidebar}
          onSignOut={signOut}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar — slide in/out */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-56 flex flex-col border-r border-zinc-800/50 bg-zinc-950 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          user={user}
          pathname={pathname}
          onNavClick={closeSidebar}
          onSignOut={signOut}
          closeButton={
            <button
              onClick={closeSidebar}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
              aria-label="Close menu"
            >
              <X size={14} aria-hidden="true" />
            </button>
          }
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-zinc-800/50 bg-zinc-950 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-zinc-400 hover:text-cyan-400 transition-colors"
            aria-label="Open admin menu"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-cyan-400" aria-hidden="true" />
            <span className="text-xs font-black text-white tracking-widest uppercase">Admin</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-zinc-600 hover:text-red-400 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>

        <main className="flex-1 p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
