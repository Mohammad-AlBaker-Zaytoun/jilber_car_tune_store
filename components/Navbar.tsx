'use client';

import { useState, useEffect } from 'react';
import TransitionLink from '@/components/transition/TransitionLink';
import { Menu, X, Gauge, ShoppingCart, LogIn, LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { useAuth } from '@/components/auth/AuthProvider';
import UserMenu from '@/components/auth/UserMenu';

const NAV_LINKS = [
  { label: 'Services', href: '/#services' },
  { label: 'Packages', href: '/#packages' },
  { label: 'Why Us', href: '/#why-us' },
  { label: 'Process', href: '/#process' },
  { label: 'Contact', href: '/#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const itemCount = useCartStore((s) => s.itemCount());
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/85 backdrop-blur-xl border-b border-white/5 shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <TransitionLink href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 border border-cyan-400/30 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors">
              <Gauge
                className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-500"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black tracking-[0.25em] text-white uppercase">
                JILBER
              </span>
              <span className="text-[9px] text-cyan-400/60 tracking-[0.2em] font-medium uppercase hidden sm:block">
                Performance
              </span>
            </div>
          </TransitionLink>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors duration-200 tracking-[0.15em] uppercase font-semibold relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
            <TransitionLink
              href="/store"
              className="text-xs text-zinc-400 hover:text-cyan-400 transition-colors duration-200 tracking-[0.15em] uppercase font-semibold relative group"
            >
              Store
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
            </TransitionLink>
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Cart */}
            <TransitionLink
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 border border-zinc-800 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 transition-all duration-200 bg-zinc-900/40 hover:bg-cyan-400/5"
              aria-label="Cart"
            >
              <ShoppingCart size={16} aria-hidden="true" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </TransitionLink>

            {/* Auth area */}
            {!loading && (
              <>
                {user ? (
                  <UserMenu />
                ) : (
                  <TransitionLink
                    href="/signin"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black text-zinc-300 border border-zinc-700 hover:border-cyan-400/40 hover:text-cyan-400 tracking-[0.15em] uppercase transition-all duration-200"
                  >
                    <LogIn size={12} aria-hidden="true" />
                    Sign In
                  </TransitionLink>
                )}
              </>
            )}

            <a
              href="/#contact"
              className="inline-flex items-center px-5 py-2.5 text-xs font-black text-black bg-cyan-400 hover:bg-cyan-300 tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
            >
              Book Now
            </a>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <TransitionLink
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-cyan-400 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={18} aria-hidden="true" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </TransitionLink>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-zinc-400 hover:text-cyan-400 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-160' : 'max-h-0'
        } bg-black/95 backdrop-blur-xl border-t border-white/5`}
      >
        <nav className="flex flex-col px-6 py-5 gap-1" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-xs text-zinc-400 hover:text-cyan-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5"
            >
              {link.label}
            </a>
          ))}
          <TransitionLink
            href="/store"
            onClick={() => setMenuOpen(false)}
            className="py-3 text-xs text-zinc-400 hover:text-cyan-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5"
          >
            Store
          </TransitionLink>
          <TransitionLink
            href="/cart"
            onClick={() => setMenuOpen(false)}
            className="py-3 text-xs text-zinc-400 hover:text-cyan-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5 flex items-center justify-between"
          >
            <span>Cart</span>
            {mounted && itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </TransitionLink>

          {/* Auth links */}
          {!loading && (
            <>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <TransitionLink
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="py-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5 flex items-center gap-2"
                    >
                      <Shield size={12} aria-hidden="true" />
                      Admin Panel
                    </TransitionLink>
                  )}
                  <TransitionLink
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="py-3 text-xs text-zinc-400 hover:text-cyan-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5 flex items-center gap-2"
                  >
                    <LayoutDashboard size={12} aria-hidden="true" />
                    My Account
                  </TransitionLink>
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="py-3 text-xs text-zinc-400 hover:text-red-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5 text-left flex items-center gap-2"
                  >
                    <LogOut size={12} aria-hidden="true" />
                    Sign Out
                  </button>
                </>
              ) : (
                <TransitionLink
                  href="/signin"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-xs text-zinc-400 hover:text-cyan-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5 flex items-center gap-2"
                >
                  <LogIn size={12} aria-hidden="true" />
                  Sign In
                </TransitionLink>
              )}
            </>
          )}

          <a
            href="/#contact"
            onClick={() => setMenuOpen(false)}
            className="mt-4 py-3.5 text-xs font-black text-black bg-cyan-400 hover:bg-cyan-300 tracking-[0.2em] uppercase text-center transition-all duration-200"
          >
            Book Consultation
          </a>
        </nav>
      </div>
    </header>
  );
}
