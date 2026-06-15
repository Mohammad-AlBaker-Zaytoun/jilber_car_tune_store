import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getSettings, updateSettings } from '@/lib/settings';

const phoneRegex = /^[+\d\s\-().]*$/;

const schema = z.object({
  shopName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().regex(phoneRegex, 'Invalid phone format').max(30).optional(),
  address: z.string().max(200).optional(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  bookingMessage: z.string().optional(),
  whatsappNumber: z.string().regex(phoneRegex, 'Invalid WhatsApp number format').max(30).optional(),
  googleMapsUrl: z
    .string()
    .url('Invalid URL')
    .refine(
      (val) => val.startsWith('https://') || val.startsWith('http://'),
      'Google Maps URL must use https:// or http://'
    )
    .or(z.literal(''))
    .optional(),
  workingHours: z.string().max(200).optional(),
  enableFloatingWhatsApp: z.boolean().optional(),
  enableFloatingCall: z.boolean().optional(),
  defaultWhatsAppMessage: z.string().max(500).optional(),
  quoteWhatsAppMessage: z.string().max(500).optional(),
  productWhatsAppMessage: z.string().max(500).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getSettings());
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 400 });
    }
    const settings = await updateSettings(result.data);
    return NextResponse.json(settings);
  } catch (err) {
    return handleAdminError(err);
  }
}
