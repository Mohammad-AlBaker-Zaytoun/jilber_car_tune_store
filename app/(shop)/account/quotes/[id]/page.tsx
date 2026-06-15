import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getQuoteById, sanitizeQuoteForCustomer } from '@/lib/quotes';
import AccountShell from '@/components/account/AccountShell';
import AccountQuoteDetailClient from '@/components/account/quotes/AccountQuoteDetailClient';

export const metadata: Metadata = {
  title: 'Quote Details',
  robots: { index: false, follow: false },
};

export default async function AccountQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([getSession(), params]);
  if (!user) redirect('/signin?redirect=/account/quotes');

  const quote = await getQuoteById(id);
  if (!quote) notFound();

  // Security: users can only view their own quotes
  if (quote.userId !== user.id) notFound();

  const safeQuote = sanitizeQuoteForCustomer(quote);

  return (
    <AccountShell user={user}>
      <AccountQuoteDetailClient quote={safeQuote} />
    </AccountShell>
  );
}
