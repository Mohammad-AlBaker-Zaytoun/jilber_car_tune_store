import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminQuotesClient from '@/components/admin/quotes/AdminQuotesClient';

export default function AdminQuotesPage() {
  return (
    <>
      <AdminPageHeader
        title="QUOTES"
        subtitle="Manage customer quote requests and enquiries."
        breadcrumbs={[{ label: 'Quotes' }]}
      />
      <AdminQuotesClient />
    </>
  );
}
