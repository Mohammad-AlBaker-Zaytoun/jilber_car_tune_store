import { notFound } from 'next/navigation';
import { getQuoteById } from '@/lib/quotes';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminQuoteDetailClient from '@/components/admin/quotes/AdminQuoteDetailClient';

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();

  return (
    <>
      <AdminPageHeader
        title={quote.quoteNumber}
        subtitle={`Quote from ${quote.customerName}`}
        breadcrumbs={[
          { label: 'Quotes', href: '/admin/quotes' },
          { label: quote.quoteNumber },
        ]}
      />
      <AdminQuoteDetailClient quote={quote} />
    </>
  );
}
