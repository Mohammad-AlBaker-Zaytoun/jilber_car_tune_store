'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
} as const;

const COLORS = {
  success: 'border-cyan-400/30 bg-cyan-400/5 text-cyan-400',
  error: 'border-red-500/30 bg-red-500/5 text-red-400',
  info: 'border-zinc-600/50 bg-zinc-800/60 text-zinc-300',
} as const;

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[item.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 border backdrop-blur-xl shadow-2xl w-full sm:w-auto sm:min-w-[260px] max-w-sm animate-toast-in ${COLORS[item.type]}`}
      role="alert"
    >
      <Icon size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-xs font-semibold tracking-wide flex-1 leading-relaxed text-zinc-100">
        {item.message}
      </p>
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 -m-1 p-1 inline-flex items-center justify-center w-6 h-6 text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timerRefs.current.get(id);
    if (t) clearTimeout(t);
    timerRefs.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      const timer = setTimeout(() => dismiss(id), 3500);
      timerRefs.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/*
        Top-anchored on phones, bottom-right from sm: up.
        The bottom-right corner belongs to FloatingContactButtons -- WhatsApp and
        Call are a primary conversion path and the thumb reaches that corner. This
        container used to share the exact same `bottom-6 right-6`, so a toast sat
        on top of those buttons for its full 3.5s lifetime.
        Not simply a larger bottom offset: FloatingContactButtons renders zero, one
        or two buttons depending on admin settings, so any fixed offset is wrong for
        one of those cases. `top-20` clears the 64px navbar unconditionally.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-20 right-4 left-4 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto z-[200] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full sm:w-auto">
            <Toast item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
