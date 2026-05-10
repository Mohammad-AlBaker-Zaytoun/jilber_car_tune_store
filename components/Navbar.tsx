'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Gauge } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Packages', href: '#packages' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
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
          <a href="#" className="flex items-center gap-2.5 group">
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
          </a>

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
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:block">
            <a
              href="#contact"
              className="inline-flex items-center px-5 py-2.5 text-xs font-black text-black bg-cyan-400 hover:bg-cyan-300 tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
            >
              Book Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-zinc-400 hover:text-cyan-400 transition-colors"
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

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-96' : 'max-h-0'
        } bg-black/95 backdrop-blur-xl border-t border-white/5`}
      >
        <nav className="flex flex-col px-6 py-5 gap-1" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-xs text-zinc-400 hover:text-cyan-400 transition-colors tracking-[0.2em] uppercase font-semibold border-b border-white/5 last:border-0"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
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
