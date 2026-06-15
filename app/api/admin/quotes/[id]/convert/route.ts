import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getQuoteById, convertQuoteToOrder } from '@/lib/quotes';
import { createOrder, generateOrderRef } from '@/lib/orders';
import { getProductBySlug } from '@/lib/products';
import { getSettings } from '@/lib/settings';
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

    const settings = await getSettings();
    const currency = settings.currency || 'USD';

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
          currency: related.currency,
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

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const clampedRate = Math.min(Math.max(settings.taxRate, 0), 100) / 100;
    const tax = Math.round(subtotal * clampedRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const order = await createOrder({
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

    const updatedQuote = await convertQuoteToOrder(quote.id, order.id);
    if (updatedQuote) notifyQuoteConvertedToOrder(updatedQuote);

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    return handleAdminError(err);
  }
}
