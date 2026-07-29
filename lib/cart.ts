import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { computeTotals } from '@/lib/currency';

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  quantity: number;
  visualColor: string;
  images?: string[];
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  /**
   * Rewrites unit prices from authoritative server values.
   *
   * The cart is persisted to localStorage with no expiry, so a price edited in
   * admin leaves the customer looking at a stale number while the server charges
   * the live one. POST /api/orders detects that and returns 409 PRICE_CHANGED;
   * this applies the corrected prices so the displayed total matches what will
   * actually be charged on the next attempt.
   */
  repriceItems: (prices: { slug: string; now: number }[]) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
  /** Tax for a given rate (0–100). The rate comes from admin settings via the
   *  server — never hardcoded here, or the cart would display a different total
   *  than the one actually charged. */
  tax: (taxRatePercent: number) => number;
  total: (taxRatePercent: number) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, qty = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      repriceItems: (prices) => {
        const bySlug = new Map(prices.map((p) => [p.slug, p.now]));
        set((state) => ({
          items: state.items.map((i) =>
            bySlug.has(i.slug) ? { ...i, price: bySlug.get(i.slug)! } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      tax: (taxRatePercent) => computeTotals(get().subtotal(), taxRatePercent).tax,

      total: (taxRatePercent) => computeTotals(get().subtotal(), taxRatePercent).total,
    }),
    {
      name: 'jilber-cart',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
