import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Gauge } from 'lucide-react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Minimal header — logo only */}
      <header className="px-6 lg:px-8 py-5 border-b border-zinc-900">
        <Link href="/" className="flex items-center gap-2.5 group w-fit">
          <div className="w-8 h-8 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors">
            <Gauge className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-[0.25em] text-white uppercase">JILBER</span>
            <span className="text-[8px] text-cyan-400/60 tracking-[0.2em] font-medium uppercase hidden sm:block">
              Performance
            </span>
          </div>
        </Link>
      </header>

      {/* Decorative background grid */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-zinc-950 via-transparent to-zinc-950 pointer-events-none"
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm p-8 sm:p-10">
            {children}
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 border-t border-zinc-900 text-center">
        <p className="text-[10px] text-zinc-700">
          &copy; 2025 JILBER Performance Engineering
        </p>
      </footer>
    </div>
  );
}
