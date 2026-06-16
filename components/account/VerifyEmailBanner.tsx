'use client';

import { useState } from 'react';
import { MailWarning } from 'lucide-react';

/** Shown on the account page when the signed-in user's email isn't verified. */
export default function VerifyEmailBanner() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const resend = async () => {
    if (state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 border border-amber-500/30 bg-amber-500/5">
      <MailWarning size={16} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 text-xs leading-relaxed">
        <p className="text-amber-300 font-bold tracking-wide uppercase text-[10px] mb-1">
          Email not verified
        </p>
        <p className="text-zinc-400">
          Confirm your email to unlock reviews and secure your account.{' '}
          {state === 'sent' ? (
            <span className="text-cyan-400">Verification link sent — check your inbox.</span>
          ) : state === 'error' ? (
            <span className="text-red-400">Couldn&apos;t send. Try again shortly.</span>
          ) : (
            <button
              onClick={resend}
              disabled={state === 'sending'}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending…' : 'Resend verification email'}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
