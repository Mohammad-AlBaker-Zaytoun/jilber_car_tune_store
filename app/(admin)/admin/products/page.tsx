import Link from 'next/link';
import { Plus } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductsClient from '@/components/admin/products/ProductsClient';

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader
        title="PRODUCTS"
        subtitle="Manage your product catalog."
        breadcrumbs={[{ label: 'Products' }]}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]"
          >
            <Plus size={12} aria-hidden="true" />
            New Product
          </Link>
        }
      />
      <ProductsClient />
    </>
  );
}
