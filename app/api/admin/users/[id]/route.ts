import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { findUserById, listUsers, updateUser, incrementTokenVersion } from '@/lib/users';
import { logger } from '@/lib/logger';

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

    // Invalidate the target's existing sessions when their role changes. The
    // role is a JWT claim, and proxy.ts + the admin layout both read it from the
    // token, so without this a demoted admin keeps the admin UI until their
    // cookie expires (up to 24h). Every admin API re-checks the live row, so
    // they could not actually read data — but the gate should not be stale.
    if (result.data.role !== undefined && result.data.role !== target.role) {
      await incrementTokenVersion(id);
      logger.info('auth.role_changed', {
        targetUserId: id,
        from: target.role,
        to: result.data.role,
        byAdminId: admin.id,
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return handleAdminError(err);
  }
}
