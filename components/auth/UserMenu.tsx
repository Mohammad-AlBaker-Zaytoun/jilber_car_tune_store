'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, ChevronDown, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-10 px-3 border border-zinc-800 hover:border-cyan-400/40 bg-zinc-900/40 hover:bg-cyan-400/5 text-zinc-400 hover:text-cyan-400 transition-all duration-200"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-5 h-5 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
          <span className="text-[8px] font-black text-cyan-400">{initials}</span>
        </div>
        <span className="text-xs font-semibold tracking-wide max-w-24 truncate hidden sm:block">
          {user.name.split(' ')[0]}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 border border-zinc-800 bg-zinc-950 shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <p className="text-xs font-black text-white truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-colors"
            >
              <LayoutDashboard size={12} aria-hidden="true" />
              My Account
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-colors"
            >
              <Package size={12} aria-hidden="true" />
              Orders
            </Link>
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-colors"
            >
              <User size={12} aria-hidden="true" />
              Profile
            </Link>
          </div>
          <div className="border-t border-zinc-800/50 py-1">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
            >
              <LogOut size={12} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
