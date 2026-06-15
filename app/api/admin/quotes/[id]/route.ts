import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import {
  getQuoteById,
  updateQuoteStatus,
  updateQuotePriority,
  updateQuoteAdminNotes,
  updateQuoteCustomerReply,
} from '@/lib/quotes.dev';
import { notifyCustomerQuoteUpdated } from '@/lib/quote-notifications';
import type { QuoteStatus, QuotePriority } from '@/types/quotes';

const QUOTE_STATUSES = [
  'new',
  'reviewing',
  'contacted',
  'quoted',
  'accepted',
  'converted_to_order',
  'rejected',
  'closed',
] as const;

const QUOTE_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

const patchSchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  priority: z.enum(QUOTE_PRIORITIES).optional(),
  adminNotes: z.string().max(5000).optional(),
  customerReply: z.string().max(2000).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const quote = await getQuoteById(id);
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(quote);
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const quote = await getQuoteById(id);
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body: unknown = await request.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, priority, adminNotes, customerReply } = result.data;

    let updated = quote;

    if (status !== undefined) {
      updated = (await updateQuoteStatus(id, status as QuoteStatus)) ?? updated;
    }
    if (priority !== undefined) {
      updated = (await updateQuotePriority(id, priority as QuotePriority)) ?? updated;
    }
    if (adminNotes !== undefined) {
      updated = (await updateQuoteAdminNotes(id, adminNotes)) ?? updated;
    }
    if (customerReply !== undefined) {
      updated = (await updateQuoteCustomerReply(id, customerReply)) ?? updated;
      notifyCustomerQuoteUpdated(updated);
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleAdminError(err);
  }
}
