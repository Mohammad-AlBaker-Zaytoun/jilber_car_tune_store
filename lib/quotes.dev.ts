/**
 * Quote request repository — MSSQL via Prisma.
 * Public function names/signatures unchanged from the old JSON store.
 * `attachments` is stored as a JSON string and mapped back to an array here.
 */

import { randomUUID, randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { Quote as QuoteRow } from '@prisma/client';
import type {
  QuoteRequest,
  QuoteStatus,
  QuotePriority,
  ServiceCategory,
  PreferredContactMethod,
} from '@/types/quotes';

export type { QuoteRequest, QuoteStatus, QuotePriority };

function iso(d: Date | null): string | undefined {
  return d ? d.toISOString() : undefined;
}

function rowToQuote(row: QuoteRow): QuoteRequest {
  return {
    id: row.id,
    quoteNumber: row.quoteNumber,
    userId: row.userId ?? undefined,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    preferredContactMethod: row.preferredContactMethod as PreferredContactMethod,
    vehicleMake: row.vehicleMake,
    vehicleModel: row.vehicleModel,
    vehicleYear: row.vehicleYear,
    vehicleEngine: row.vehicleEngine,
    transmission: row.transmission ?? undefined,
    mileage: row.mileage ?? undefined,
    currentModifications: row.currentModifications ?? undefined,
    serviceCategory: row.serviceCategory as ServiceCategory,
    performanceGoal: row.performanceGoal ?? undefined,
    budgetRange: row.budgetRange ?? undefined,
    desiredTimeline: row.desiredTimeline ?? undefined,
    message: row.message,
    relatedProductId: row.relatedProductId ?? undefined,
    relatedProductSlug: row.relatedProductSlug ?? undefined,
    relatedProductName: row.relatedProductName ?? undefined,
    attachments: JSON.parse(row.attachments) as string[],
    status: row.status as QuoteStatus,
    priority: row.priority as QuotePriority,
    adminNotes: row.adminNotes ?? undefined,
    customerReply: row.customerReply ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    contactedAt: iso(row.contactedAt),
    quotedAt: iso(row.quotedAt),
    convertedToOrderId: row.convertedToOrderId ?? undefined,
  };
}

export function generateQuoteNumber(): string {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(5);
  const code = Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
  return `QUOTE-${yyyymmdd}-${code}`;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getQuotes(): Promise<QuoteRequest[]> {
  const rows = await prisma.quote.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(rowToQuote);
}

export async function getQuoteById(id: string): Promise<QuoteRequest | null> {
  const row = await prisma.quote.findUnique({ where: { id } });
  return row ? rowToQuote(row) : null;
}

export async function getQuotesByUserId(userId: string): Promise<QuoteRequest[]> {
  const rows = await prisma.quote.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(rowToQuote);
}

export async function countQuotes(): Promise<{
  total: number;
  new: number;
  reviewing: number;
  quoted: number;
  accepted: number;
  converted: number;
}> {
  const [total, _new, reviewing, quoted, accepted, converted] = await Promise.all([
    prisma.quote.count(),
    prisma.quote.count({ where: { status: 'new' } }),
    prisma.quote.count({ where: { status: 'reviewing' } }),
    prisma.quote.count({ where: { status: 'quoted' } }),
    prisma.quote.count({ where: { status: 'accepted' } }),
    prisma.quote.count({ where: { status: 'converted_to_order' } }),
  ]);
  return { total, new: _new, reviewing, quoted, accepted, converted };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createQuote(
  data: Omit<
    QuoteRequest,
    'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'quoteNumber'
  >
): Promise<QuoteRequest> {
  const { attachments, ...rest } = data;
  const row = await prisma.quote.create({
    data: {
      id: randomUUID(),
      quoteNumber: generateQuoteNumber(),
      status: 'new',
      priority: 'normal',
      attachments: JSON.stringify(attachments ?? []),
      ...rest,
    },
  });
  return rowToQuote(row);
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<QuoteRequest | null> {
  const prev = await prisma.quote.findUnique({ where: { id } });
  if (!prev) return null;

  const now = new Date();
  const row = await prisma.quote.update({
    where: { id },
    data: {
      status,
      updatedAt: now,
      contactedAt: status === 'contacted' && !prev.contactedAt ? now : prev.contactedAt,
      quotedAt: status === 'quoted' && !prev.quotedAt ? now : prev.quotedAt,
    },
  });
  return rowToQuote(row);
}

export async function updateQuotePriority(
  id: string,
  priority: QuotePriority
): Promise<QuoteRequest | null> {
  try {
    const row = await prisma.quote.update({
      where: { id },
      data: { priority, updatedAt: new Date() },
    });
    return rowToQuote(row);
  } catch {
    return null;
  }
}

export async function updateQuoteAdminNotes(
  id: string,
  adminNotes: string
): Promise<QuoteRequest | null> {
  try {
    const row = await prisma.quote.update({
      where: { id },
      data: { adminNotes, updatedAt: new Date() },
    });
    return rowToQuote(row);
  } catch {
    return null;
  }
}

export async function updateQuoteCustomerReply(
  id: string,
  customerReply: string
): Promise<QuoteRequest | null> {
  try {
    const row = await prisma.quote.update({
      where: { id },
      data: { customerReply, updatedAt: new Date() },
    });
    return rowToQuote(row);
  } catch {
    return null;
  }
}

export async function convertQuoteToOrder(
  id: string,
  orderId: string
): Promise<QuoteRequest | null> {
  try {
    const row = await prisma.quote.update({
      where: { id },
      data: {
        status: 'converted_to_order',
        convertedToOrderId: orderId,
        updatedAt: new Date(),
      },
    });
    return rowToQuote(row);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Customer-safe serialisation — strips adminNotes before sending to customer
// ---------------------------------------------------------------------------

export function sanitizeQuoteForCustomer(
  quote: QuoteRequest
): Omit<QuoteRequest, 'adminNotes'> {
  const { adminNotes: _adminNotes, ...base } = quote;
  return base;
}
