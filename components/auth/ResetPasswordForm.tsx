'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import PasswordInput from './PasswordInput';

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setServerError('');
    const errs: FormErrors = {};
    if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (confirmPassword !== newPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <CheckCircle size={24} className="text-cyan-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center mb-3">
          PASSWORD UPDATED
        </h1>
        <p className="text-sm text-zinc-500 text-center leading-relaxed">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.replace('/signin')}
          className="mt-8 w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center border border-red-500/30 bg-red-500/5">
            <AlertCircle size={24} className="text-red-400" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          INVALID LINK
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          This reset link is missing its token. Please request a new one.
        </p>
        <p className="mt-8 text-sm text-zinc-500">
          <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Request a new link
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
          RESET PASSWORD
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Choose a new password for your account.</p>
      </div>

      {serverError && (
        <div className="flex items-center gap-2.5 p-4 mb-6 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <PasswordInput
          label="New Password"
          id="newPassword"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setErrors((p) => ({ ...p, newPassword: undefined }));
            if (serverError) setServerError('');
          }}
          placeholder="At least 8 characters"
          required
          error={errors.newPassword}
        />

        <PasswordInput
          label="Confirm Password"
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setErrors((p) => ({ ...p, confirmPassword: undefined }));
            if (serverError) setServerError('');
          }}
          placeholder="Re-enter your new password"
          required
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 mt-1"
        >
          <KeyRound size={13} aria-hidden="true" />
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
