import AdminPageHeader from '@/components/admin/AdminPageHeader';
import OrdersClient from '@/components/admin/orders/OrdersClient';

export default function AdminOrdersPage() {
  return (
    <>
      <AdminPageHeader
        title="ORDERS"
        subtitle="View and manage customer orders."
        breadcrumbs={[{ label: 'Orders' }]}
      />
      <OrdersClient />
    </>
  );
}
