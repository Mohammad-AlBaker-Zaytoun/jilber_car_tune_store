import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getQuoteById, sanitizeQuoteForCustomer } from '@/lib/quotes';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quote = await getQuoteById(id);

    if (!quote) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Security: users can only view their own quotes
    if (quote.userId !== session.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeQuoteForCustomer(quote));
  } catch (err) {
    console.error('[account/quotes/[id]/GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
