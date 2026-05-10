'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errs: FormErrors = {};
  if (!email.trim()) errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
  if (!password) errs.password = 'Password is required';
  return errs;
}

export default function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/account';
  const { refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(email, password);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      await refresh();
      router.push(redirect);
      router.refresh();
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-6 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
            Welcome Back
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
          SIGN IN
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            href={`/signup${redirect !== '/account' ? `?redirect=${redirect}` : ''}`}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="flex items-center gap-2.5 p-4 mb-6 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormInput
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
          placeholder="you@email.com"
          required
          error={errors.email}
        />

        <PasswordInput
          label="Password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
          placeholder="Your password"
          required
          error={errors.password}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 mt-1"
        >
          <LogIn size={13} aria-hidden="true" />
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-[10px] text-zinc-700">
        By signing in you agree to our{' '}
        <a href="/terms-of-service" className="underline hover:text-zinc-500 transition-colors">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy-policy" className="underline hover:text-zinc-500 transition-colors">Privacy Policy</a>.
      </p>
    </div>
  );
}
