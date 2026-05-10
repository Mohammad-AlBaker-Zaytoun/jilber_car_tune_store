'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm border border-zinc-800 bg-zinc-950 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          <X size={14} aria-hidden="true" />
        </button>

        <div className="p-6">
          <div className={`w-10 h-10 flex items-center justify-center border mb-4 ${
            danger ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-400/30 bg-yellow-400/5'
          }`}>
            <AlertTriangle
              size={16}
              className={danger ? 'text-red-400' : 'text-yellow-400'}
              aria-hidden="true"
            />
          </div>

          <h2 id="confirm-title" className="text-sm font-black text-white mb-2">
            {title}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">{message}</p>

          <div className="flex items-center gap-3">
            <button
              ref={cancelRef}
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 text-xs font-black tracking-widest uppercase border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 text-xs font-black tracking-widest uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                danger
                  ? 'bg-red-500 hover:bg-red-400 text-white'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-black'
              }`}
            >
              {loading ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
