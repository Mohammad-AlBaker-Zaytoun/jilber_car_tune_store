'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';
import type { Product } from '@/data/products';

interface Props {
  product: Product;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  size = 'md',
  fullWidth = false,
}: Props) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { addToast } = useToast();

  const handleClick = () => {
    if (!product.inStock || added) return;
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        currency: product.currency,
        visualColor: product.visualColor,
        images: product.images,
      },
      quantity
    );
    addToast(`${product.name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-xs',
  };

  return (
    <button
      onClick={handleClick}
      disabled={!product.inStock}
      className={`${fullWidth ? 'w-full' : ''} ${sizeClasses[size]} inline-flex items-center justify-center gap-2 font-black tracking-[0.2em] uppercase transition-all duration-200 ${
        added
          ? 'bg-emerald-400 text-black hover:bg-emerald-300'
          : 'bg-cyan-400 hover:bg-cyan-300 text-black hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]'
      } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none`}
    >
      {added ? (
        <>
          <Check size={13} aria-hidden="true" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart size={13} aria-hidden="true" />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </>
      )}
    </button>
  );
}
