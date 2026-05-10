const BADGE_STYLES: Record<string, string> = {
  'Best Seller': 'bg-cyan-400/10 text-cyan-400 border-cyan-400/25',
  Popular: 'bg-cyan-400/10 text-cyan-300 border-cyan-300/25',
  Premium: 'bg-amber-400/10 text-amber-400 border-amber-400/25',
  Featured: 'bg-violet-400/10 text-violet-400 border-violet-400/25',
  Limited: 'bg-rose-400/10 text-rose-400 border-rose-400/25',
  New: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25',
};

const DEFAULT_STYLE = 'bg-zinc-700/30 text-zinc-400 border-zinc-600/30';

export default function ProductBadge({ label }: { label: string }) {
  const style = BADGE_STYLES[label] ?? DEFAULT_STYLE;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[9px] font-black tracking-[0.2em] uppercase border ${style}`}
    >
      {label}
    </span>
  );
}
