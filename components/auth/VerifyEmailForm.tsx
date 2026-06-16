'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'verifying' | 'success' | 'error' | 'missing';

export default function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'missing');
  const [error, setError] = useState('');
  // Tokens are single-use, so the POST must fire exactly once even under React
  // strict-mode's double effect invocation (otherwise the second call consumes
  // an already-used token and flips a success to an error).
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? 'Verification failed. Please request a new link.');
          setStatus('error');
          return;
        }
        setStatus('success');
      } catch {
        if (cancelled) return;
        setError('Something went wrong. Please try again.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <Loader2 size={24} className="text-cyan-400 animate-spin" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          VERIFYING…
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">Confirming your email address.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <MailCheck size={24} className="text-cyan-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          EMAIL CONFIRMED
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Thanks — your email address is verified.
        </p>
        <button
          onClick={() => router.replace('/account')}
          className="mt-8 w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
        >
          Go to My Account
        </button>
      </div>
    );
  }

  // 'error' or 'missing'
  return (
    <div className="w-full max-w-md text-center">
      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 flex items-center justify-center border border-red-500/30 bg-red-500/5">
          <AlertCircle size={24} className="text-red-400" aria-hidden="true" />
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
        {status === 'missing' ? 'INVALID LINK' : 'VERIFICATION FAILED'}
      </h1>
      <p className="text-sm text-zinc-500 leading-relaxed">
        {status === 'missing'
          ? 'This verification link is missing its token.'
          : error}
      </p>
      <p className="mt-8 text-sm text-zinc-500">
        Signed in?{' '}
        <Link href="/account" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
          Resend from your account
        </Link>
      </p>
    </div>
  );
}
