'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  FileQuestion,
  AlertCircle,
  Eye,
  RefreshCw,
  CheckSquare,
  Star,
  ArrowUpDown,
} from 'lucide-react';
import type { QuoteRequest, QuoteStatus, QuotePriority, ServiceCategory } from '@/types/quotes';
import {
  QUOTE_STATUSES,
  QUOTE_PRIORITIES,
  SERVICE_CATEGORIES,
  formatQuoteStatus,
  formatQuotePriority,
} from '@/types/quotes';
import QuoteStatusBadge from '@/components/quotes/QuoteStatusBadge';
import QuotePriorityBadge from '@/components/quotes/QuotePriorityBadge';

export default function AdminQuotesClient() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<QuotePriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | ''>('');

  const load = () => {
    setLoading(true);
    setFetchError('');
    fetch('/api/admin/quotes')
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<QuoteRequest[]>;
      })
      .then((data) => setQuotes(Array.isArray(data) ? data : []))
      .catch((err: unknown) => {
        console.error('[AdminQuotesClient]', err);
        setFetchError('Failed to load quotes. Check your connection and try again.');
      })
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const stats = useMemo(
    () => ({
      total: quotes.length,
      new: quotes.filter((q) => q.status === 'new').length,
      reviewing: quotes.filter((q) => q.status === 'reviewing').length,
      quoted: quotes.filter((q) => q.status === 'quoted').length,
      accepted: quotes.filter((q) => q.status === 'accepted').length,
      converted: quotes.filter((q) => q.status === 'converted_to_order').length,
    }),
    [quotes]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return quotes
      .filter((qt) => !statusFilter || qt.status === statusFilter)
      .filter((qt) => !priorityFilter || qt.priority === priorityFilter)
      .filter((qt) => !categoryFilter || qt.serviceCategory === categoryFilter)
      .filter(
        (qt) =>
          !q ||
          qt.quoteNumber.toLowerCase().includes(q) ||
          qt.customerName.toLowerCase().includes(q) ||
          qt.customerEmail.toLowerCase().includes(q) ||
          qt.customerPhone.toLowerCase().includes(q) ||
          `${qt.vehicleMake} ${qt.vehicleModel}`.toLowerCase().includes(q) ||
          qt.serviceCategory.toLowerCase().includes(q)
      );
  }, [quotes, search, statusFilter, priorityFilter, categoryFilter]);

  const StatCard = ({
    label,
    value,
    filterValue,
    icon: Icon,
    color,
  }: {
    label: string;
    value: number;
    filterValue: QuoteStatus | '';
    icon: React.ElementType;
    color: string;
  }) => (
    <button
      onClick={() => setStatusFilter(filterValue)}
      className={`border border-zinc-800/50 bg-zinc-900/20 p-4 text-left hover:border-zinc-700 transition-colors ${
        statusFilter === filterValue ? 'border-zinc-600' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">{label}</p>
        <Icon size={12} className={color} aria-hidden="true" />
      </div>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </button>
  );

  if (loading) {
    return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;
  }

  if (fetchError) {
    return (
      <div className="border border-red-400/30 bg-red-400/5 p-6 flex items-start gap-3">
        <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-xs text-red-300 mb-3">{fetchError}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 border border-red-400/20 text-red-400 hover:border-red-400/40 text-[10px] font-bold tracking-wide uppercase transition-colors"
          >
            <RefreshCw size={11} aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Total" value={stats.total} filterValue="" icon={FileQuestion} color="text-zinc-400" />
        <StatCard label="New" value={stats.new} filterValue="new" icon={AlertCircle} color="text-cyan-400" />
        <StatCard label="Reviewing" value={stats.reviewing} filterValue="reviewing" icon={Eye} color="text-blue-400" />
        <StatCard label="Quoted" value={stats.quoted} filterValue="quoted" icon={Star} color="text-amber-400" />
        <StatCard label="Accepted" value={stats.accepted} filterValue="accepted" icon={CheckSquare} color="text-emerald-400" />
        <StatCard label="Converted" value={stats.converted} filterValue="converted_to_order" icon={ArrowUpDown} color="text-teal-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, name, email, phone, vehicle…"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | '')}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Statuses</option>
          {QUOTE_STATUSES.map((s) => (
            <option key={s} value={s}>{formatQuoteStatus(s)}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as QuotePriority | '')}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Priorities</option>
          {QUOTE_PRIORITIES.map((p) => (
            <option key={p} value={p}>{formatQuotePriority(p)}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | '')}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Categories</option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button
          onClick={load}
          className="p-2.5 border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} aria-hidden="true" />
        </button>

        <span className="text-[10px] text-zinc-600 ml-auto">
          {filtered.length} quote{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-16 gap-4">
          <FileQuestion size={32} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">
            {quotes.length === 0
              ? 'No quote requests yet. They will appear here after customers submit.'
              : 'No quotes match your filters.'}
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Quote
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">
                  Service
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden lg:table-cell">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/quotes/${quote.id}`}
                      className="text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {quote.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-zinc-300 font-semibold">{quote.customerName}</p>
                    <p className="text-[10px] text-zinc-600">{quote.customerEmail}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs text-zinc-500">
                      {quote.vehicleYear} {quote.vehicleMake} {quote.vehicleModel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-zinc-500">{quote.serviceCategory}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <QuotePriorityBadge priority={quote.priority} />
                  </td>
                  <td className="px-4 py-3.5">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[10px] text-zinc-600">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
