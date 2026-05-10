import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductForm from '@/components/admin/products/ProductForm';

export default function AdminNewProductPage() {
  return (
    <>
      <AdminPageHeader
        title="NEW PRODUCT"
        breadcrumbs={[{ label: 'Products', href: '/admin/products' }, { label: 'New' }]}
      />
      <ProductForm mode="new" />
    </>
  );
}
