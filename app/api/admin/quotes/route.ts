import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getQuotes } from '@/lib/quotes.dev';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getQuotes());
  } catch (err) {
    return handleAdminError(err);
  }
}
