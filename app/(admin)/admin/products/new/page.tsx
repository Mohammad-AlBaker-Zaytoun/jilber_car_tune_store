import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductForm from '@/components/admin/products/ProductForm';
import { getCategoryNames } from '@/lib/categories';

export default async function AdminNewProductPage() {
  const categories = await getCategoryNames();

  return (
    <>
      <AdminPageHeader
        title="NEW PRODUCT"
        breadcrumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'New' }]}
      />
      <ProductForm mode="new" categories={categories} />
    </>
  );
}
