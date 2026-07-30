import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';
import { verifyPayToken } from '@/lib/payments/pay-token';
import { getOrderById } from '@/lib/orders';
import ResumePayment from '@/components/checkout/ResumePayment';

// Never prerender: the whole page is a function of a one-time token.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Complete your payment', robots: { index: false } };

/**
 * Landing page for the signed pay link emailed when the gateway could not take
 * payment at checkout. This is how a GUEST recovers — guest orders have no
 * userId, so /account/orders is not available to them.
 *
 * The token is verified here only to render a useful message. Authorisation is
 * re-done independently by POST /api/orders/[id]/pay, which never trusts this
 * page.
 */
export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const orderId = token ? await verifyPayToken(token) : null;
  const order = orderId ? await getOrderById(orderId) : null;

  if (!token || !orderId || !order) {
    return (
      <div className="bg-zinc-950 min-h-svh flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center border border-amber-500/30 bg-amber-500/5">
              <AlertTriangle size={28} className="text-amber-400" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-5">
            THIS PAYMENT LINK IS NO LONGER VALID
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Payment links expire after 7 days. Your order is still saved — reply to
            your confirmation email or contact us and we&apos;ll send a new link, or
            you can pay at the workshop.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200"
          >
            <Home size={13} aria-hidden="true" />
            Contact Us
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResumePayment
      orderId={order.id}
      token={token}
      orderRef={order.ref}
      total={order.total}
      alreadyPaid={order.paymentStatus === 'paid'}
    />
  );
}
