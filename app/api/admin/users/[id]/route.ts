import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { findUserById, listUsers, updateUser } from '@/lib/users.dev';

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

    const target = findUserById(id);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Prevent demoting the last admin
    if (result.data.role === 'user' && target.role === 'admin') {
      const adminCount = listUsers().filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last admin' }, { status: 400 });
      }
    }

    const updated = updateUser(id, result.data);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { passwordHash: _pw, ...safe } = updated;
    void _pw;
    return NextResponse.json(safe);
  } catch (err) {
    return handleAdminError(err);
  }
}
