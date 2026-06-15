import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { listUsers } from '@/lib/users';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await listUsers());
  } catch (err) {
    return handleAdminError(err);
  }
}
