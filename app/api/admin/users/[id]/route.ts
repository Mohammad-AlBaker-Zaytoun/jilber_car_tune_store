import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { findUserById, listUsers, updateUser } from '@/lib/users';

const schema = z.object({
  role: z.enum(['user', 'admin']).optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json({ error: 'You cannot modify your own role' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const target = await findUserById(id);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Prevent demoting the last admin
    if (result.data.role === 'user' && target.role === 'admin') {
      const adminCount = (await listUsers()).filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
      }
    }

    const updated = await updateUser(id, result.data);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    return handleAdminError(err);
  }
}
