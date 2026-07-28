import { getSettings } from '@/lib/settings';
import CheckoutForm from '@/components/checkout/CheckoutForm';

// Must be per-request. Prerendering this page would bake the tax rate into
// static HTML at build time, so an admin changing it in /admin/settings would
// leave checkout displaying the old rate while POST /api/orders charges the new
// one — the display-vs-charge mismatch this page exists to prevent.
export const dynamic = 'force-dynamic';

/**
 * Server shell: resolves the admin-configured tax rate so the summary shown
 * before "Place Order" matches what POST /api/orders actually charges. The form
 * reads the cart from localStorage, so it stays a client component.
 */
export default async function CheckoutPage() {
  const { taxRate } = await getSettings();
  return <CheckoutForm taxRate={taxRate} />;
}
