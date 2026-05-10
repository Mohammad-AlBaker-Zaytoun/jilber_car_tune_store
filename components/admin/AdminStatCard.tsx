import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'cyan' | 'green' | 'red' | 'yellow' | 'purple';
  sub?: string;
}

const ACCENT = {
  cyan: { icon: 'text-cyan-400', border: 'border-cyan-400/20', bg: 'bg-cyan-400/5' },
  green: { icon: 'text-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5' },
  red: { icon: 'text-red-400', border: 'border-red-400/20', bg: 'bg-red-400/5' },
  yellow: { icon: 'text-yellow-400', border: 'border-yellow-400/20', bg: 'bg-yellow-400/5' },
  purple: { icon: 'text-purple-400', border: 'border-purple-400/20', bg: 'bg-purple-400/5' },
};

export default function AdminStatCard({ label, value, icon: Icon, accent = 'cyan', sub }: Props) {
  const c = ACCENT[accent];
  return (
    <div className="border border-zinc-800/50 bg-zinc-900/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-2">{label}</p>
          <p className="text-2xl font-black text-white leading-none">{value}</p>
          {sub && <p className="text-[10px] text-zinc-600 mt-1.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 shrink-0 flex items-center justify-center border ${c.border} ${c.bg}`}>
          <Icon size={16} className={c.icon} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
