'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/lib/cart';

// Triggers localStorage rehydration on the client after first render.
// Must live in the root layout to run on every page load.
export function CartHydrate() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
  return null;
}
