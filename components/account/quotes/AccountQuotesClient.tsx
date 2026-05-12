'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileQuestion, ChevronRight } from 'lucide-react';
import type { QuoteRequest } from '@/types/quotes';
import QuoteStatusBadge from '@/components/quotes/QuoteStatusBadge';

export default function AccountQuotesClient() {
  const [quotes, setQuotes] = useState<Omit<QuoteRequest, 'adminNotes'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/account/quotes')
      .then((r) => r.json())
      .then((data) => setQuotes(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (qt) =>
        qt.quoteNumber.toLowerCase().includes(q) ||
        `${qt.vehicleMake} ${qt.vehicleModel}`.toLowerCase().includes(q) ||
        qt.serviceCategory.toLowerCase().includes(q)
    );
  }, [quotes, search]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">
        Loading your quotes…
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center text-center py-20 px-8">
        <div className="w-16 h-16 flex items-center justify-center border border-zinc-800 bg-zinc-900/40 mb-6">
          <FileQuestion size={24} className="text-zinc-600" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-black text-white mb-2">No quotes yet</h3>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
          Request a custom quote for any performance build, tuning service, or vehicle upgrade.
        </p>
        <Link
          href="/quote"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
        >
          Request a Quote
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-44">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref, vehicle, or service…"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>
        <span className="text-[10px] text-zinc-600 ml-auto">
          {filtered.length} quote{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-12 gap-3">
          <FileQuestion size={24} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">No quotes match your search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((quote) => (
            <Link
              key={quote.id}
              href={`/account/quotes/${quote.id}`}
              className="border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40 p-5 transition-all duration-200 group block"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-cyan-400 group-hover:text-cyan-300 transition-colors tracking-wider">
                      {quote.quoteNumber}
                    </p>
                    <ChevronRight
                      size={12}
                      className="text-zinc-700 group-hover:text-cyan-400 transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {new Date(quote.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <QuoteStatusBadge status={quote.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
                <div>
                  <span className="text-zinc-600 uppercase tracking-wider font-bold">Vehicle</span>
                  <p className="text-zinc-400 mt-0.5">
                    {quote.vehicleYear} {quote.vehicleMake} {quote.vehicleModel}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-600 uppercase tracking-wider font-bold">Service</span>
                  <p className="text-zinc-400 mt-0.5">{quote.serviceCategory}</p>
                </div>
                {quote.customerReply && (
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-zinc-600 uppercase tracking-wider font-bold">Response</span>
                    <p className="text-zinc-400 mt-0.5 truncate">{quote.customerReply}</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
