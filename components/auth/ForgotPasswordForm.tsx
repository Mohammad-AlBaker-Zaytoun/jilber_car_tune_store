'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Send, AlertCircle, MailCheck } from 'lucide-react';
import FormInput from './FormInput';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 200) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <MailCheck size={24} className="text-cyan-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center mb-3">
          CHECK YOUR EMAIL
        </h1>
        <p className="text-sm text-zinc-500 text-center leading-relaxed">
          If an account exists for <span className="text-zinc-300">{email}</span>, we&apos;ve sent a
          link to reset your password. The link expires in 1 hour.
        </p>
        <p className="mt-8 text-center text-sm text-zinc-500">
          <Link href="/signin" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-6 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
            Account Recovery
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
          FORGOT PASSWORD
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 mb-6 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormInput
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          placeholder="you@email.com"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 mt-1"
        >
          <Send size={13} aria-hidden="true" />
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Remembered it?{' '}
        <Link href="/signin" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
