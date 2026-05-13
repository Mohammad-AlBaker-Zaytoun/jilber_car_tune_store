'use client';

import { useCartStore } from '@/lib/cart';
import CartItemRow from '@/components/cart/CartItemRow';
import OrderSummary from '@/components/cart/OrderSummary';
import EmptyState from '@/components/store/EmptyState';
import SupportCtaCard from '@/components/contact/SupportCtaCard';


export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount());
  const clearCart = useCartStore((s) => s.clearCart);

  return (
    <div className="bg-zinc-950 pt-28 lg:pt-32 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Review Order
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            YOUR CART
          </h1>
        </div>

        {items.length === 0 ? (
          <EmptyState variant="empty-cart" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2 pb-3 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500 tracking-[0.15em] uppercase font-semibold">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
                <button
                  onClick={clearCart}
                  className="text-[10px] text-zinc-600 hover:text-red-400 tracking-[0.15em] uppercase font-semibold transition-colors"
                >
                  Clear Cart
                </button>
              </div>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-4">
              <OrderSummary />
              <SupportCtaCard
                heading="Need help before checkout?"
                body="Our team is ready to assist with product questions or order details."
                whatsappMessage="Hello, I need help with my cart before checkout."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
