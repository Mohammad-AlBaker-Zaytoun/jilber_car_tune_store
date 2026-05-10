'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthProvider';
import FormInput from './FormInput';
import PasswordInput from './PasswordInput';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const INITIAL: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  terms: false,
};

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.name = 'Full name must be at least 2 characters';
  if (!form.email.trim()) errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
  if (!form.password) errs.password = 'Password is required';
  else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
  if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  if (!form.terms) errs.terms = 'You must accept the terms to continue';
  return errs;
}

export default function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/account';
  const { refresh } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField =
    (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = key === 'terms' ? e.target.checked : e.target.value;
      setForm((p) => ({ ...p, [key]: value }));
      setErrors((p) => ({ ...p, [key]: undefined }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      // Auto sign-in after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (loginRes.ok) {
        await refresh();
        router.push(redirect);
        router.refresh();
      } else {
        router.push('/signin');
      }
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md flex flex-col items-center text-center gap-4 py-8">
        <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
          <CheckCircle size={28} className="text-cyan-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-black text-white">Account Created</h2>
        <p className="text-sm text-zinc-500">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-6 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
            Create Account
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
          SIGN UP
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            Sign in
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
          label="Full Name"
          id="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={setField('name')}
          placeholder="John Smith"
          required
          error={errors.name}
        />

        <FormInput
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={setField('email')}
          placeholder="you@email.com"
          required
          error={errors.email}
        />

        <FormInput
          label="Phone (optional)"
          id="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={setField('phone')}
          placeholder="+1 555 000 0000"
        />

        <PasswordInput
          label="Password"
          id="password"
          autoComplete="new-password"
          value={form.password}
          onChange={setField('password')}
          placeholder="Minimum 8 characters"
          required
          error={errors.password}
        />

        <PasswordInput
          label="Confirm Password"
          id="confirmPassword"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={setField('confirmPassword')}
          placeholder="Repeat your password"
          required
          error={errors.confirmPassword}
        />

        {/* Terms */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="terms"
              checked={form.terms}
              onChange={setField('terms')}
              className="mt-0.5 w-4 h-4 shrink-0 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
              I agree to the{' '}
              <a href="/terms-of-service" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Privacy Policy
              </a>
            </span>
          </label>
          {errors.terms && <p className="text-red-400 text-[10px]">{errors.terms}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2 mt-1"
        >
          <UserPlus size={13} aria-hidden="true" />
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
