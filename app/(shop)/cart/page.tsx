import { getSettings } from '@/lib/settings';
import CartClient from '@/components/cart/CartClient';

// Per-request for the same reason as /checkout: a prerendered tax rate goes
// stale the moment an admin edits it, and the cart total would stop matching
// what is actually charged.
export const dynamic = 'force-dynamic';

/**
 * Server shell: resolves the admin-configured tax rate so the cart displays the
 * same total the order API will charge. The cart itself is client-side (zustand
 * + localStorage), so everything below this boundary stays a client component.
 */
export default async function CartPage() {
  const { taxRate } = await getSettings();
  return <CartClient taxRate={taxRate} />;
}
