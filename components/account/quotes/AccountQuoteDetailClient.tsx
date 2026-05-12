'use client';

import Link from 'next/link';
import { ArrowLeft, Car, User, Wrench, MessageSquare, Package } from 'lucide-react';
import type { QuoteRequest } from '@/types/quotes';
import QuoteStatusBadge from '@/components/quotes/QuoteStatusBadge';

type SafeQuote = Omit<QuoteRequest, 'adminNotes'>;

interface Props {
  quote: SafeQuote;
}

const sectionCls = 'border border-zinc-800/50 bg-zinc-900/20 p-6';
const labelCls = 'text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1';
const valueCls = 'text-xs text-zinc-300';

export default function AccountQuoteDetailClient({ quote }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Back + header */}
      <div>
        <Link
          href="/account/quotes"
          className="inline-flex items-center gap-2 text-[10px] text-zinc-600 hover:text-cyan-400 transition-colors mb-4"
        >
          <ArrowLeft size={12} aria-hidden="true" />
          All Quotes
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-2xl font-black text-white tracking-wider">{quote.quoteNumber}</p>
            <p className="text-[10px] text-zinc-600 mt-1">
              Submitted{' '}
              {new Date(quote.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>
      </div>

      {/* Customer reply from team */}
      {quote.customerReply && (
        <div className="border border-cyan-400/20 bg-cyan-400/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={13} className="text-cyan-400" aria-hidden="true" />
            <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">
              Message from JILBER
            </h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {quote.customerReply}
          </p>
          {quote.quotedAt && (
            <p className="text-[10px] text-zinc-600 mt-3">
              Quoted on{' '}
              {new Date(quote.quotedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* Vehicle */}
      <div className={sectionCls}>
        <div className="flex items-center gap-2 mb-4">
          <Car size={13} className="text-cyan-400" aria-hidden="true" />
          <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Vehicle</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className={labelCls}>Make</p>
            <p className={valueCls}>{quote.vehicleMake}</p>
          </div>
          <div>
            <p className={labelCls}>Model</p>
            <p className={valueCls}>{quote.vehicleModel}</p>
          </div>
          <div>
            <p className={labelCls}>Year</p>
            <p className={valueCls}>{quote.vehicleYear}</p>
          </div>
          {quote.vehicleEngine && (
            <div>
              <p className={labelCls}>Engine</p>
              <p className={valueCls}>{quote.vehicleEngine}</p>
            </div>
          )}
          {quote.transmission && (
            <div>
              <p className={labelCls}>Transmission</p>
              <p className={valueCls}>{quote.transmission}</p>
            </div>
          )}
          {quote.mileage && (
            <div>
              <p className={labelCls}>Mileage</p>
              <p className={valueCls}>{quote.mileage}</p>
            </div>
          )}
          {quote.currentModifications && (
            <div className="col-span-2 sm:col-span-3">
              <p className={labelCls}>Current Modifications</p>
              <p className={`${valueCls} leading-relaxed`}>{quote.currentModifications}</p>
            </div>
          )}
        </div>
      </div>

      {/* Project details */}
      <div className={sectionCls}>
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={13} className="text-cyan-400" aria-hidden="true" />
          <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Project Details</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className={labelCls}>Service Category</p>
            <p className={valueCls}>{quote.serviceCategory}</p>
          </div>
          {quote.performanceGoal && (
            <div>
              <p className={labelCls}>Performance Goal</p>
              <p className={valueCls}>{quote.performanceGoal}</p>
            </div>
          )}
          {quote.budgetRange && (
            <div>
              <p className={labelCls}>Budget Range</p>
              <p className={valueCls}>{quote.budgetRange}</p>
            </div>
          )}
          {quote.desiredTimeline && (
            <div>
              <p className={labelCls}>Timeline</p>
              <p className={valueCls}>{quote.desiredTimeline}</p>
            </div>
          )}
        </div>
        <div>
          <p className={labelCls}>Description</p>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{quote.message}</p>
        </div>
      </div>

      {/* Related product */}
      {quote.relatedProductName && (
        <div className={sectionCls}>
          <div className="flex items-center gap-2 mb-4">
            <Package size={13} className="text-cyan-400" aria-hidden="true" />
            <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Related Product</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-300">{quote.relatedProductName}</p>
            </div>
            {quote.relatedProductSlug && (
              <Link
                href={`/store/${quote.relatedProductSlug}`}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-wide transition-colors"
              >
                View Product →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Contact info */}
      <div className={sectionCls}>
        <div className="flex items-center gap-2 mb-4">
          <User size={13} className="text-cyan-400" aria-hidden="true" />
          <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Your Contact Info</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className={labelCls}>Name</p>
            <p className={valueCls}>{quote.customerName}</p>
          </div>
          <div>
            <p className={labelCls}>Email</p>
            <p className={valueCls}>{quote.customerEmail}</p>
          </div>
          <div>
            <p className={labelCls}>Phone</p>
            <p className={valueCls}>{quote.customerPhone}</p>
          </div>
          <div>
            <p className={labelCls}>Preferred Contact</p>
            <p className={valueCls} style={{ textTransform: 'capitalize' }}>
              {quote.preferredContactMethod}
            </p>
          </div>
        </div>
      </div>

      {/* Converted to order */}
      {quote.convertedToOrderId && (
        <div className="border border-teal-400/20 bg-teal-400/5 p-4 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" aria-hidden="true" />
          <p className="text-xs text-zinc-300">
            This quote has been converted to an order.{' '}
            <Link
              href={`/account/orders/${quote.convertedToOrderId}`}
              className="text-teal-400 hover:text-teal-300 font-bold transition-colors"
            >
              View Order →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
