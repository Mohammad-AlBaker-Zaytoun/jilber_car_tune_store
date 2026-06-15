import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products.dev';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductForm from '@/components/admin/products/ProductForm';

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title="EDIT PRODUCT"
        breadcrumbs={[
          { label: 'Products', href: '/admin/products' },
          { label: product.name },
        ]}
      />
      <ProductForm mode="edit" initial={product} />
    </>
  );
}
