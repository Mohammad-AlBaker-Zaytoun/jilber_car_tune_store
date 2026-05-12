import type { QuoteStatus } from '@/types/quotes';
import { formatQuoteStatus } from '@/types/quotes';

interface Props {
  status: QuoteStatus;
}

const colorMap: Record<QuoteStatus, string> = {
  new: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  reviewing: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  contacted: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  quoted: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  accepted: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  converted_to_order: 'bg-teal-400/10 text-teal-400 border-teal-400/20',
  rejected: 'bg-red-400/10 text-red-400 border-red-400/20',
  closed: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/40',
};

export default function QuoteStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black tracking-[0.15em] uppercase border ${colorMap[status] ?? colorMap.closed}`}
    >
      {formatQuoteStatus(status)}
    </span>
  );
}
