'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, ChevronRight, Package, Wrench, Users, FileQuestion } from 'lucide-react';
import type { Product } from '@/data/products';
import { getRelatedProducts } from '@/data/products';
import type { SessionUser } from '@/lib/auth';
import type { PublicReview } from '@/lib/reviews.dev';
import ProductVisual from './ProductVisual';
import ProductBadge from './ProductBadge';
import AddToCartButton from './AddToCartButton';
import QuantitySelector from './QuantitySelector';
import ProductCard from './ProductCard';
import StarRating from './StarRating';
import ProductReviewsSection from './reviews/ProductReviewsSection';

interface Props {
  product: Product;
  session: SessionUser | null;
  initialReviews: PublicReview[];
  userReview: PublicReview | null;
}

export default function ProductDetails({
  product,
  session,
  initialReviews,
  userReview,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const related = getRelatedProducts(product, 3);
  const images = product.images?.filter(Boolean) ?? [];
  const hasImages = images.length > 0;

  // Effective rating: prefer customer reviews, fall back to admin-managed fields
  const hasCustomerReviews = initialReviews.length > 0;
  const effectiveRating = hasCustomerReviews
    ? Math.round(
        (initialReviews.reduce((s, r) => s + r.rating, 0) / initialReviews.length) * 10
      ) / 10
    : product.rating;
  const effectiveCount = hasCustomerReviews ? initialReviews.length : product.reviewCount;
  const ratingIsCustomer = hasCustomerReviews;

  return (
    <div className="bg-zinc-950 pt-28 lg:pt-32 pb-20 lg:pb-28">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10">
        <nav className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold">
          <Link href="/" className="text-zinc-600 hover:text-cyan-400 transition-colors">Home</Link>
          <ChevronRight size={10} className="text-zinc-700" />
          <Link href="/store" className="text-zinc-600 hover:text-cyan-400 transition-colors">Store</Link>
          <ChevronRight size={10} className="text-zinc-700" />
          <span className="text-zinc-500">{product.name}</span>
        </nav>
      </div>

      {/* Main product area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-20">
          {/* Left: Visual / Gallery */}
          <div className="flex flex-col gap-4">
            <div className="border border-zinc-800/50 overflow-hidden">
              {hasImages ? (
                <div className="relative h-72 overflow-hidden group/main">
                  <img
                    src={images[activeIdx]}
                    alt={`${product.name} — image ${activeIdx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/main:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(6,10,16,0.7), transparent)' }}
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-zinc-900/80 text-zinc-500 text-[10px] font-bold px-2 py-1 tracking-wide">
                      {activeIdx + 1} / {images.length}
                    </div>
                  )}
                </div>
              ) : (
                <ProductVisual
                  category={product.category}
                  visualColor={product.visualColor}
                  visualColor2={product.visualColor2}
                  size="lg"
                />
              )}
            </div>

            {/* Thumbnail strip — only shown when multiple images exist */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`relative shrink-0 w-16 h-16 border overflow-hidden transition-all duration-200 ${
                      i === activeIdx
                        ? 'border-cyan-400/70 opacity-100'
                        : 'border-zinc-800 opacity-50 hover:opacity-80 hover:border-zinc-600'
                    }`}
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={i === activeIdx}
                  >
                    <img
                      src={src}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Key spec chips */}
            {product.specs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.specs.slice(0, 4).map(({ label, value }) => (
                  <div
                    key={label}
                    className="px-3 py-2 border border-zinc-800/50 bg-zinc-900/40 text-center min-w-20"
                  >
                    <p className="text-[9px] text-zinc-500 tracking-wide uppercase font-semibold">{label}</p>
                    <p className="text-xs text-white font-black mt-0.5 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col gap-5">
            {/* Category + badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-[10px] font-bold tracking-[0.25em] uppercase"
                style={{ color: product.visualColor }}
              >
                {product.category}
              </span>
              {product.badge && <ProductBadge label={product.badge} />}
            </div>

            {/* Name */}
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex flex-col gap-1">
              <StarRating rating={effectiveRating} count={effectiveCount} size={13} />
              {effectiveCount > 0 && (
                <span className="text-[9px] text-zinc-600 tracking-[0.15em] uppercase font-medium">
                  {ratingIsCustomer
                    ? `Based on ${effectiveCount} customer ${effectiveCount === 1 ? 'review' : 'reviews'}`
                    : 'Store rating'}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">
                ${product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <span className="text-lg text-zinc-600 line-through">
                  ${product.oldPrice.toLocaleString()}
                </span>
              )}
              {product.oldPrice && (
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                  Save ${(product.oldPrice - product.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <CheckCircle size={14} className="text-emerald-400" aria-hidden="true" />
                  <span className="text-xs text-emerald-400 font-semibold">In Stock — Available Now</span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-red-400" aria-hidden="true" />
                  <span className="text-xs text-red-400 font-semibold">Out of Stock</span>
                </>
              )}
            </div>

            {/* Short description */}
            <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-5">
              {product.shortDescription}
            </p>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <QuantitySelector quantity={quantity} onChange={setQuantity} />
              <AddToCartButton
                product={product}
                quantity={quantity}
                size="lg"
              />
            </div>

            {/* Quote CTA */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href={`/quote?product=${encodeURIComponent(product.slug)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 bg-zinc-900/40 hover:border-cyan-400/40 hover:text-cyan-400 text-zinc-400 font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-200"
              >
                <FileQuestion size={12} aria-hidden="true" />
                Request a Quote
              </Link>
              <span className="text-[10px] text-zinc-600">Need installation? Ask us.</span>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800/50">
              {[
                { icon: CheckCircle, label: '12-Month Guarantee' },
                { icon: Package, label: 'Fast Dispatch' },
                { icon: Users, label: 'Expert Support' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center p-3 border border-zinc-800/50 bg-zinc-900/20">
                  <Icon size={14} className="text-cyan-400" aria-hidden="true" />
                  <span className="text-[9px] text-zinc-500 font-semibold tracking-wide leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Description / Specs / Compatibility / Included */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Description */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-4 flex items-center gap-2">
                <Wrench size={12} className="text-cyan-400" aria-hidden="true" />
                Description
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Specs */}
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-5 flex items-center gap-2">
                <Package size={12} className="text-cyan-400" aria-hidden="true" />
                Specifications
              </h2>
              <div className="flex flex-col divide-y divide-zinc-800/50">
                {product.specs.map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 text-sm gap-4">
                    <span className="text-zinc-500 shrink-0">{label}</span>
                    <span className="text-zinc-300 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Compatibility + Included */}
          <div className="flex flex-col gap-6">
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-4">
                Compatibility
              </h2>
              <ul className="flex flex-col gap-2">
                {product.compatibility.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span
                      className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                      style={{ background: product.visualColor }}
                      aria-hidden="true"
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-4">
                What&apos;s Included
              </h2>
              <ul className="flex flex-col gap-2">
                {product.includedItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-zinc-400">
                    <CheckCircle
                      size={11}
                      className="text-cyan-400 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Customer Reviews section */}
        <div className="mb-20">
          <ProductReviewsSection
            productId={product.id}
            productSlug={product.slug}
            adminRating={product.rating}
            adminReviewCount={product.reviewCount}
            session={session}
            initialReviews={initialReviews}
            initialUserReview={userReview}
          />
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase">
                Related Products
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
