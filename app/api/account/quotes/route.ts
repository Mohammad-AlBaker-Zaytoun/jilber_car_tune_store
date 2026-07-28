import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getQuotesByUserId, sanitizeQuoteForCustomer } from '@/lib/quotes';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quotes = (await getQuotesByUserId(session.id)).map(sanitizeQuoteForCustomer);
    return NextResponse.json(quotes);
  } catch (err) {
    logger.error('account.quotes.get.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
