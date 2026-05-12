import type { PaymentStatus } from '@/types/admin';
import { PAYMENT_STATUS_COLORS, formatPaymentStatus } from '@/components/admin/orderStatus';

interface Props {
  status: PaymentStatus;
  size?: 'sm' | 'xs';
}

export default function PaymentStatusBadge({ status, size = 'xs' }: Props) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[9px]';
  return (
    <span
      className={`inline-flex items-center font-black tracking-widest uppercase border px-2 py-0.5 ${textSize} ${PAYMENT_STATUS_COLORS[status]}`}
    >
      {formatPaymentStatus(status)}
    </span>
  );
}
