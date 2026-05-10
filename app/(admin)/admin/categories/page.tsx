import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CategoriesClient from '@/components/admin/categories/CategoriesClient';

export default function AdminCategoriesPage() {
  return (
    <>
      <AdminPageHeader
        title="CATEGORIES"
        subtitle="Manage product categories."
        breadcrumbs={[{ label: 'Categories' }]}
      />
      <CategoriesClient />
    </>
  );
}
