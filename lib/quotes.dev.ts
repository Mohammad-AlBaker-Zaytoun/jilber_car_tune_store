/**
 * DEV-ONLY quote request store — JSON file on disk.
 * Replace with a real database before production.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID, randomBytes } from 'crypto';
import type { QuoteRequest, QuoteStatus, QuotePriority } from '@/types/quotes';

export type { QuoteRequest, QuoteStatus, QuotePriority };

const DB_PATH = path.join(process.cwd(), '.dev-quotes.json');

function readStore(): QuoteRequest[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as QuoteRequest[];
  } catch {
    return [];
  }
}

function writeStore(quotes: QuoteRequest[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(quotes, null, 2), 'utf-8');
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

export function getQuotes(): QuoteRequest[] {
  return readStore().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getQuoteById(id: string): QuoteRequest | null {
  return readStore().find((q) => q.id === id) ?? null;
}

export function getQuotesByUserId(userId: string): QuoteRequest[] {
  return readStore()
    .filter((q) => q.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function countQuotes(): {
  total: number;
  new: number;
  reviewing: number;
  quoted: number;
  accepted: number;
  converted: number;
} {
  const all = readStore();
  return {
    total: all.length,
    new: all.filter((q) => q.status === 'new').length,
    reviewing: all.filter((q) => q.status === 'reviewing').length,
    quoted: all.filter((q) => q.status === 'quoted').length,
    accepted: all.filter((q) => q.status === 'accepted').length,
    converted: all.filter((q) => q.status === 'converted_to_order').length,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function createQuote(
  data: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'quoteNumber'>
): QuoteRequest {
  const quotes = readStore();
  const id = randomUUID();
  const now = new Date().toISOString();
  const quote: QuoteRequest = {
    ...data,
    id,
    quoteNumber: generateQuoteNumber(),
    status: 'new',
    priority: 'normal',
    createdAt: now,
    updatedAt: now,
  };
  writeStore([...quotes, quote]);
  return quote;
}

export function updateQuoteStatus(id: string, status: QuoteStatus): QuoteRequest | null {
  const quotes = readStore();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  const prev = quotes[idx];
  const now = new Date().toISOString();
  quotes[idx] = {
    ...prev,
    status,
    updatedAt: now,
    contactedAt: status === 'contacted' && !prev.contactedAt ? now : prev.contactedAt,
    quotedAt: status === 'quoted' && !prev.quotedAt ? now : prev.quotedAt,
  };
  writeStore(quotes);
  return quotes[idx];
}

export function updateQuotePriority(id: string, priority: QuotePriority): QuoteRequest | null {
  const quotes = readStore();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  quotes[idx] = { ...quotes[idx], priority, updatedAt: new Date().toISOString() };
  writeStore(quotes);
  return quotes[idx];
}

export function updateQuoteAdminNotes(id: string, adminNotes: string): QuoteRequest | null {
  const quotes = readStore();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  quotes[idx] = { ...quotes[idx], adminNotes, updatedAt: new Date().toISOString() };
  writeStore(quotes);
  return quotes[idx];
}

export function updateQuoteCustomerReply(id: string, customerReply: string): QuoteRequest | null {
  const quotes = readStore();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  quotes[idx] = { ...quotes[idx], customerReply, updatedAt: new Date().toISOString() };
  writeStore(quotes);
  return quotes[idx];
}

export function convertQuoteToOrder(id: string, orderId: string): QuoteRequest | null {
  const quotes = readStore();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  quotes[idx] = {
    ...quotes[idx],
    status: 'converted_to_order',
    convertedToOrderId: orderId,
    updatedAt: new Date().toISOString(),
  };
  writeStore(quotes);
  return quotes[idx];
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
