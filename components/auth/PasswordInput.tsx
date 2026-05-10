'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  id: string;
  error?: string;
}

const inputBase =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 pr-11 outline-none transition-colors duration-200 placeholder:text-zinc-600';

export default function PasswordInput({ label, id, error, required, ...rest }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
      >
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required={required}
          className={`${inputBase} ${error ? 'border-red-500/50' : ''}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        </button>
      </div>
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
    </div>
  );
}
