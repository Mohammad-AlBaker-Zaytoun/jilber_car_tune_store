import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createQuote } from '@/lib/quotes.dev';
import { getSession } from '@/lib/session';
import { getProductBySlug } from '@/lib/products.dev';
import { notifyQuoteSubmitted, notifyAdminNewQuote } from '@/lib/quote-notifications';
import { SERVICE_CATEGORIES } from '@/types/quotes';
import type { ServiceCategory, PreferredContactMethod } from '@/types/quotes';

const CONTACT_METHODS = ['phone', 'whatsapp', 'email'] as const;

const schema = z.object({
  customerName: z.string().min(1, 'Full name is required').max(100),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(1, 'Phone is required').max(30),
  preferredContactMethod: z.enum(CONTACT_METHODS),

  vehicleMake: z.string().min(1, 'Vehicle make is required').max(60),
  vehicleModel: z.string().min(1, 'Vehicle model is required').max(60),
  vehicleYear: z
    .string()
    .regex(/^\d{4}$/, 'Year must be 4 digits')
    .refine(
      (y) => {
        const n = parseInt(y, 10);
        return n >= 1900 && n <= new Date().getFullYear() + 2;
      },
      { message: 'Enter a valid vehicle year' }
    ),
  vehicleEngine: z.string().max(80).default(''),
  transmission: z.string().max(60).optional(),
  mileage: z.string().max(30).optional(),
  currentModifications: z.string().max(500).optional(),

  serviceCategory: z.enum(
    SERVICE_CATEGORIES as [ServiceCategory, ...ServiceCategory[]]
  ),
  performanceGoal: z.string().max(300).optional(),
  budgetRange: z.string().max(60).optional(),
  desiredTimeline: z.string().max(60).optional(),
  message: z
    .string()
    .min(20, 'Please describe your project in at least 20 characters')
    .max(2000),

  relatedProductSlug: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const session = await getSession();

    // Resolve related product if slug provided
    let relatedProductId: string | undefined;
    let relatedProductName: string | undefined;
    let relatedProductSlug: string | undefined;

    if (data.relatedProductSlug) {
      const product = await getProductBySlug(data.relatedProductSlug);
      if (product) {
        relatedProductId = product.id;
        relatedProductName = product.name;
        relatedProductSlug = product.slug;
      }
    }

    const quote = await createQuote({
      userId: session?.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      preferredContactMethod: data.preferredContactMethod as PreferredContactMethod,
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      vehicleEngine: data.vehicleEngine,
      transmission: data.transmission || undefined,
      mileage: data.mileage || undefined,
      currentModifications: data.currentModifications || undefined,
      serviceCategory: data.serviceCategory,
      performanceGoal: data.performanceGoal || undefined,
      budgetRange: data.budgetRange || undefined,
      desiredTimeline: data.desiredTimeline || undefined,
      message: data.message,
      relatedProductId,
      relatedProductSlug,
      relatedProductName,
    });

    notifyQuoteSubmitted(quote);
    notifyAdminNewQuote(quote);

    return NextResponse.json(
      { quoteId: quote.id, quoteNumber: quote.quoteNumber },
      { status: 201 }
    );
  } catch (err) {
    console.error('[quotes/POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
