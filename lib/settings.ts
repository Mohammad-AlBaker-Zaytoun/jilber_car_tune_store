/**
 * Settings repository — MSSQL via Prisma.
 *
 * Settings are a single row (id = 1). getSettings reads it, falling back to (and
 * seeding) DEFAULTS when absent; updateSettings upserts. Public function
 * names/signatures unchanged from the old JSON store.
 */

import { prisma } from '@/lib/db/prisma';
import type { Setting as SettingRow } from '@prisma/client';
import type { AdminSettings } from '@/types/admin';

const SETTINGS_ID = 1;

const DEFAULTS: AdminSettings = {
  shopName: 'JILBER Performance',
  contactEmail: '',
  contactPhone: '',
  address: '',
  currency: 'USD',
  taxRate: 10,
  bookingMessage:
    'Thank you for booking with JILBER. Our team will contact you within 24 hours to confirm your appointment.',
  whatsappNumber: '',
  googleMapsUrl: '',
  workingHours: 'Mon–Fri 8 am–7 pm · Sat 9 am–5 pm · Sun Closed',
  enableFloatingWhatsApp: true,
  enableFloatingCall: true,
  defaultWhatsAppMessage: 'Hello, I would like to get more information about your services.',
  quoteWhatsAppMessage: 'Hello, I want to request a quote for my vehicle.',
  productWhatsAppMessage: 'Hello, I am interested in {productName}. Can you provide more details?',
};

function rowToSettings(row: SettingRow): AdminSettings {
  return {
    shopName: row.shopName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    address: row.address,
    currency: row.currency,
    taxRate: row.taxRate,
    bookingMessage: row.bookingMessage,
    whatsappNumber: row.whatsappNumber,
    googleMapsUrl: row.googleMapsUrl,
    workingHours: row.workingHours,
    enableFloatingWhatsApp: row.enableFloatingWhatsApp,
    enableFloatingCall: row.enableFloatingCall,
    defaultWhatsAppMessage: row.defaultWhatsAppMessage,
    quoteWhatsAppMessage: row.quoteWhatsAppMessage,
    productWhatsAppMessage: row.productWhatsAppMessage,
  };
}

export async function getSettings(): Promise<AdminSettings> {
  const row = await prisma.setting.findUnique({ where: { id: SETTINGS_ID } });
  return row ? { ...DEFAULTS, ...rowToSettings(row) } : DEFAULTS;
}

export async function updateSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
  // Atomic: upsert writes only the provided fields in a single statement.
  // No read-merge-write, so concurrent updates to disjoint fields no longer
  // clobber each other (last-write-wins only on the same field).
  const row = await prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...DEFAULTS, ...data },
    update: data,
  });
  return { ...DEFAULTS, ...rowToSettings(row) };
}
