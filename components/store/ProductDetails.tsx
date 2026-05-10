'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, ChevronRight, Package, Wrench, Users } from 'lucide-react';
import type { Product } from '@/data/products';
import { getRelatedProducts } from '@/data/products';
import ProductVisual from './ProductVisual';
import ProductBadge from './ProductBadge';
import AddToCartButton from './AddToCartButton';
import QuantitySelector from './QuantitySelector';
import ProductCard from './ProductCard';
import StarRating from './StarRating';

export default function ProductDetails({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const related = getRelatedProducts(product, 3);

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
          {/* Left: Visual */}
          <div className="flex flex-col gap-4">
            <div className="border border-zinc-800/50 overflow-hidden">
              <ProductVisual
                category={product.category}
                visualColor={product.visualColor}
                visualColor2={product.visualColor2}
                size="lg"
              />
            </div>
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
            <StarRating rating={product.rating} count={product.reviewCount} size={13} />

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
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
