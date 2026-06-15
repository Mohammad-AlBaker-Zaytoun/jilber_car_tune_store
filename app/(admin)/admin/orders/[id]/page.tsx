import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/orders';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import OrderDetailClient from '@/components/admin/orders/OrderDetailClient';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <>
      <AdminPageHeader
        title={order.ref}
        subtitle={`Order from ${order.customer.fullName}`}
        breadcrumbs={[
          { label: 'Orders', href: '/admin/orders' },
          { label: order.ref },
        ]}
      />
      <OrderDetailClient order={order} />
    </>
  );
}
