import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Store, LayoutDashboard, ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Quote Request Received',
  robots: { index: false, follow: false },
};

export default async function QuoteSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [session, sp] = await Promise.all([getSession(), searchParams]);
  const quoteRef = sp.ref ?? '';

  return (
    <div className="bg-zinc-950 min-h-screen pt-28 lg:pt-32 pb-20 flex items-start justify-center">
      <div className="max-w-xl w-full mx-auto px-6">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center border border-emerald-400/30 bg-emerald-400/5">
            <CheckCircle size={36} className="text-emerald-400" aria-hidden="true" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Confirmed
            </span>
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Request Received
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your quote request has been received. Our team will review your vehicle details and
            contact you with the next steps.
          </p>
        </div>

        {/* Reference */}
        {quoteRef && (
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 mb-8 text-center">
            <p className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-2">
              Your Quote Reference
            </p>
            <p className="text-xl font-black text-cyan-400 tracking-widest">{quoteRef}</p>
            <p className="text-[11px] text-zinc-600 mt-2">
              Keep this reference for your records
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 mb-8">
          <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-4">
            What Happens Next
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { step: '1', text: 'Our engineers review your vehicle and project details.' },
              { step: '2', text: 'We prepare a tailored quote with pricing and timeline.' },
              { step: '3', text: 'We reach out via your preferred contact method within 1–2 business days.' },
              { step: '4', text: 'Once approved, we schedule your vehicle for the build.' },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 text-xs">
                <span className="w-5 h-5 flex items-center justify-center border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 font-black text-[10px] shrink-0">
                  {step}
                </span>
                <p className="text-zinc-400 leading-relaxed pt-0.5">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/store"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.4)]"
          >
            <Store size={13} aria-hidden="true" />
            Browse Store
          </Link>

          {session ? (
            <Link
              href="/account/quotes"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 text-zinc-300 hover:text-white font-black text-xs tracking-[0.2em] uppercase transition-all duration-200"
            >
              <LayoutDashboard size={13} aria-hidden="true" />
              My Quotes
            </Link>
          ) : (
            <Link
              href="/signin"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 text-zinc-300 hover:text-white font-black text-xs tracking-[0.2em] uppercase transition-all duration-200"
            >
              <ArrowRight size={13} aria-hidden="true" />
              Sign In to Track
            </Link>
          )}
        </div>

        {!session && (
          <p className="text-center text-[11px] text-zinc-600 mt-5 leading-relaxed">
            Create an account or sign in to track your quote requests and get status updates in one
            place.
          </p>
        )}

        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
