import type { OrderStatus } from '@/types/admin';
import { STATUS_COLORS, formatStatus } from '@/components/admin/orderStatus';

interface Props {
  status: OrderStatus;
  size?: 'sm' | 'xs';
}

export default function OrderStatusBadge({ status, size = 'xs' }: Props) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[9px]';
  return (
    <span
      className={`inline-flex items-center font-black tracking-widest uppercase border px-2 py-0.5 ${textSize} ${STATUS_COLORS[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
