import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminInquiriesClient from '@/components/admin/inquiries/AdminInquiriesClient';

export default function AdminInquiriesPage() {
  return (
    <>
      <AdminPageHeader
        title="INQUIRIES"
        subtitle="Contact form submissions from the website."
        breadcrumbs={[{ label: 'Inquiries' }]}
      />
      <AdminInquiriesClient />
    </>
  );
}
