import type { OrderStatusHistoryEntry } from '@/types/admin';
import { STATUS_COLORS, formatStatus } from '@/components/admin/orderStatus';

interface Props {
  history: OrderStatusHistoryEntry[];
  showActor?: boolean; // admin view shows who changed; customer view hides it
}

export default function OrderStatusTimeline({ history, showActor = false }: Props) {
  if (history.length === 0) {
    return <p className="text-xs text-zinc-600 italic">No status history available.</p>;
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {history.map((entry, i) => {
        const isLast = i === history.length - 1;
        return (
          <li key={entry.id} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0" aria-hidden="true">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-0.5 ${
                  isLast
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-zinc-600 bg-zinc-900'
                }`}
              />
              {!isLast && <div className="w-px flex-1 bg-zinc-800 mt-1 mb-1" />}
            </div>

            {/* Content */}
            <div className={`pb-5 min-w-0 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span
                  className={`text-[9px] font-black tracking-widest uppercase border px-1.5 py-0.5 ${STATUS_COLORS[entry.toStatus]}`}
                >
                  {formatStatus(entry.toStatus)}
                </span>
                {entry.fromStatus && (
                  <span className="text-[9px] text-zinc-600">
                    from{' '}
                    <span className="text-zinc-500">{formatStatus(entry.fromStatus)}</span>
                  </span>
                )}
              </div>

              <p className="text-[10px] text-zinc-600">
                {new Date(entry.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {showActor && entry.changedByName && (
                  <span className="ml-2 text-zinc-700">· {entry.changedByName}</span>
                )}
              </p>

              {entry.note && (
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{entry.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
