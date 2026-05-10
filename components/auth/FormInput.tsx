import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

const inputBase =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600';

export default function FormInput({ label, id, error, required, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
      >
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </label>
      <input
        id={id}
        required={required}
        className={`${inputBase} ${error ? 'border-red-500/50' : ''}`}
        {...rest}
      />
      {error && <p className="text-red-400 text-[10px]">{error}</p>}
    </div>
  );
}
