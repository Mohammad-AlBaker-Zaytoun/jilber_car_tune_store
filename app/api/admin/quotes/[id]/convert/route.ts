import { NextResponse, after } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getQuoteById, claimQuoteForConversion, releaseQuoteClaim } from '@/lib/quotes';
import { createOrder, generateOrderRef } from '@/lib/orders';
import { getProductBySlug } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import { STORE_CURRENCY, computeTotals } from '@/lib/currency';
import { notifyQuoteConvertedToOrder } from '@/lib/quote-notifications';
import type { OrderItem } from '@/types/admin';

/**
 * POST /api/admin/quotes/[id]/convert
 *
 * Creates a service order seeded from the quote's customer + vehicle details and
 * links the two. If the quote references a product, it becomes the first line
 * item; otherwise a zero-priced "Custom service" placeholder is added so the
 * admin can set the real items/pricing on the order afterwards.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const quote = await getQuoteById(id);
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (quote.convertedToOrderId) {
      return NextResponse.json(
        { error: 'This quote has already been converted to an order.', orderId: quote.convertedToOrderId },
        { status: 409 }
      );
    }

    // Claim the quote BEFORE creating the order. The read above is advisory
    // only — without an atomic claim, two concurrent admin clicks both saw
    // convertedToOrderId === null and each created an order, leaving the first
    // one untracked. The order is created with this exact id below.
    const orderId = randomUUID();
    if (!(await claimQuoteForConversion(quote.id, orderId))) {
      const fresh = await getQuoteById(id);
      return NextResponse.json(
        {
          error: 'This quote has already been converted to an order.',
          orderId: fresh?.convertedToOrderId,
        },
        { status: 409 }
      );
    }

    const settings = await getSettings();
    // Store is USD-only — see lib/currency.ts.
    const currency = STORE_CURRENCY;

    // Build the first line item from the related product if present.
    let items: OrderItem[];
    const related = quote.relatedProductSlug
      ? await getProductBySlug(quote.relatedProductSlug)
      : undefined;

    if (related) {
      items = [
        {
          id: related.id,
          slug: related.slug,
          name: related.name,
          category: related.category,
          price: related.price,
          currency,
          quantity: 1,
          visualColor: related.visualColor,
        },
      ];
    } else {
      items = [
        {
          id: 'custom-service',
          slug: 'custom-service',
          name: 'Custom service (pricing to be set)',
          category: quote.serviceCategory,
          price: 0,
          currency,
          quantity: 1,
          visualColor: '#00d4ff',
        },
      ];
    }

    const { subtotal, tax, total } = computeTotals(
      items.reduce((s, i) => s + i.price * i.quantity, 0),
      settings.taxRate
    );

    let order;
    try {
      order = await createOrder({
        id: orderId,
        ref: generateOrderRef(),
        userId: quote.userId,
        customer: {
          fullName: quote.customerName,
          email: quote.customerEmail,
          phone: quote.customerPhone,
          address: '',
        },
        vehicle: {
          make: quote.vehicleMake,
          model: quote.vehicleModel,
          year: quote.vehicleYear,
          engine: quote.vehicleEngine,
          currentMods: quote.currentModifications ?? '',
          serviceDate: '',
        },
        items,
        payment: 'shop',
        paymentStatus: 'unpaid',
        subtotal,
        tax,
        total,
        currency,
        adminNotes: `Created from quote ${quote.quoteNumber}.`,
        initialHistoryEntry: {
          fromStatus: null,
          toStatus: 'pending',
          changedByUserId: admin.id,
          changedByName: admin.name,
          note: `Converted from quote ${quote.quoteNumber}`,
          createdAt: new Date().toISOString(),
        },
        });
    } catch (err) {
      // Order creation failed after the claim — release it so the quote stays
      // convertible instead of being permanently marked as converted to an
      // order that does not exist.
      await releaseQuoteClaim(quote.id, orderId);
      throw err;
    }

    const updatedQuote = await getQuoteById(quote.id);
    if (updatedQuote) after(() => notifyQuoteConvertedToOrder(updatedQuote));

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    return handleAdminError(err);
  }
}
