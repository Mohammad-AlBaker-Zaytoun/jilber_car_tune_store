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

/**
 * Reads the JSON-encoded string[] columns.
 *
 * Tolerant on purpose: the column is text, so a hand-edited row or a value
 * written before the column existed must degrade to "no extra addresses"
 * rather than throw on every page that renders the footer.
 */
function parseStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * Shipped values, not placeholders.
 *
 * The settings table is empty — no row has ever been saved — so getSettings has
 * been returning this object verbatim since launch, and the blank contact fields
 * meant the site published no phone number or address at all while the floating
 * WhatsApp and call buttons were switched on. The shop's real details belong
 * here so they are live without depending on someone opening /admin/settings,
 * and anything set there still wins from the moment the row is created.
 */
const DEFAULTS: AdminSettings = {
  shopName: 'Pro Tuning',
  // The address the site itself writes to: mailto CTAs and the organisation
  // JSON-LD. The other two are listed beside it on the contact section.
  contactEmail: 'gilbert@protuningshop.com',
  additionalEmails: ['sales@protuningshop.com', 'contact@protuningshop.com'],
  contactPhone: '+961 3 867 342',
  address: '',
  currency: 'USD',
  taxRate: 10,
  bookingMessage:
    'Thank you for booking with Pro Tuning. Our team will contact you within 24 hours to confirm your appointment.',
  // Same line as contactPhone. Without it the floating WhatsApp button rendered
  // nothing while enableFloatingWhatsApp was true.
  whatsappNumber: '+961 3 867 342',
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
    additionalEmails: parseStringArray(row.additionalEmails),
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

/**
 * Settings shape to column shape.
 *
 * Only `additionalEmails` differs: it is a string[] in the app and a
 * JSON-encoded column in the database. Absent stays absent, so a partial update
 * never overwrites addresses the caller did not send.
 */
function toRow(data: Partial<AdminSettings>) {
  const { additionalEmails, ...rest } = data;
  return additionalEmails === undefined
    ? rest
    : { ...rest, additionalEmails: JSON.stringify(additionalEmails.map((e) => e.trim()).filter(Boolean)) };
}

/** DEFAULTS in column shape, so `create` still supplies every required field. */
const DEFAULT_ROW = {
  ...DEFAULTS,
  additionalEmails: JSON.stringify(DEFAULTS.additionalEmails),
};

export async function updateSettings(data: Partial<AdminSettings>): Promise<AdminSettings> {
  // Atomic: upsert writes only the provided fields in a single statement.
  // No read-merge-write, so concurrent updates to disjoint fields no longer
  // clobber each other (last-write-wins only on the same field).
  const row = await prisma.setting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...DEFAULT_ROW, ...toRow(data) },
    update: toRow(data),
  });
  return { ...DEFAULTS, ...rowToSettings(row) };
}
