import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AccountShell from '@/components/account/AccountShell';
import AccountQuotesClient from '@/components/account/quotes/AccountQuotesClient';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'My Quotes',
  robots: { index: false, follow: false },
};

export default async function AccountQuotesPage() {
  const user = await getSession();
  if (!user) redirect('/signin?redirect=/account/quotes');

  return (
    <AccountShell user={user}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-1">
              Quote Requests
            </h2>
            <p className="text-xs text-zinc-600">Track your performance build enquiries</p>
          </div>
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-200"
          >
            New Quote
          </Link>
        </div>
        <AccountQuotesClient />
      </div>
    </AccountShell>
  );
}
