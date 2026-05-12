import type { QuotePriority } from '@/types/quotes';
import { formatQuotePriority } from '@/types/quotes';

interface Props {
  priority: QuotePriority;
}

const colorMap: Record<QuotePriority, string> = {
  low: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/40',
  normal: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/40',
  high: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  urgent: 'bg-red-400/10 text-red-400 border-red-400/20',
};

export default function QuotePriorityBadge({ priority }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black tracking-[0.15em] uppercase border ${colorMap[priority] ?? colorMap.normal}`}
    >
      {formatQuotePriority(priority)}
    </span>
  );
}
