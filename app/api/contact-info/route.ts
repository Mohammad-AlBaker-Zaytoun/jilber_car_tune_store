import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import type { PublicContactInfo } from '@/lib/contact';

export async function GET() {
  const s = await getSettings();
  const info: PublicContactInfo = {
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    address: s.address,
    whatsappNumber: s.whatsappNumber,
    googleMapsUrl: s.googleMapsUrl,
    workingHours: s.workingHours,
    enableFloatingWhatsApp: s.enableFloatingWhatsApp,
    enableFloatingCall: s.enableFloatingCall,
    defaultWhatsAppMessage: s.defaultWhatsAppMessage,
    quoteWhatsAppMessage: s.quoteWhatsAppMessage,
    productWhatsAppMessage: s.productWhatsAppMessage,
  };
  return NextResponse.json(info, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
