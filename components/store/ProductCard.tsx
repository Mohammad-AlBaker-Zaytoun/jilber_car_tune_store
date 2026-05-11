'use client';

import Link from 'next/link';
import type { Product } from '@/data/products';
import ProductVisual from './ProductVisual';
import ProductBadge from './ProductBadge';
import AddToCartButton from './AddToCartButton';
import StarRating from './StarRating';

export default function ProductCard({ product }: { product: Product }) {
  const discountPct = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <Link
      href={`/store/${product.slug}`}
      className="group relative flex flex-col border border-zinc-800/50 hover:border-zinc-700/80 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300 overflow-hidden"
    >
      {product.badge && (
        <div className="absolute top-3 left-3 z-10">
          <ProductBadge label={product.badge} />
        </div>
      )}

      {discountPct && (
        <div className="absolute top-3 right-3 z-10 bg-emerald-400 text-black text-[9px] font-black px-1.5 py-0.5 tracking-wide">
          -{discountPct}%
        </div>
      )}

      {!product.inStock && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-400 border border-zinc-700 px-3 py-1.5">
            Out of Stock
          </span>
        </div>
      )}

      <ProductVisual
        category={product.category}
        visualColor={product.visualColor}
        visualColor2={product.visualColor2}
        imageUrl={product.images?.[0]}
        productName={product.name}
        size="md"
      />

      <div className="flex flex-col flex-1 p-5 gap-3">
        <span
          className="text-[9px] font-bold tracking-[0.25em] uppercase"
          style={{ color: product.visualColor }}
        >
          {product.category}
        </span>

        <h3 className="text-sm font-black text-white leading-snug group-hover:text-cyan-400 transition-colors duration-200">
          {product.name}
        </h3>

        <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 flex-1">
          {product.shortDescription}
        </p>

        <StarRating rating={product.rating} count={product.reviewCount} />

        <div className="flex items-baseline gap-2 pt-1 border-t border-zinc-800/50">
          <span className="text-base font-black text-white">
            ${product.price.toLocaleString()}
          </span>
          {product.oldPrice && (
            <span className="text-[11px] text-zinc-600 line-through">
              ${product.oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* stopPropagation prevents the Link from navigating when button is clicked */}
        <div onClick={(e) => e.stopPropagation()}>
          <AddToCartButton product={product} fullWidth />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, transparent, ${product.visualColor}60, transparent)`,
        }}
      />
    </Link>
  );
}
