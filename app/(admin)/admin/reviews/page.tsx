import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminReviewsClient from '@/components/admin/reviews/AdminReviewsClient';

export const metadata = {
  title: 'Reviews | Pro Tuning Admin',
};

export default function AdminReviewsPage() {
  return (
    <>
      <AdminPageHeader
        title="REVIEWS"
        subtitle="Moderate customer product reviews."
        breadcrumbs={[{ label: 'Reviews' }]}
      />
      <AdminReviewsClient />
    </>
  );
}
