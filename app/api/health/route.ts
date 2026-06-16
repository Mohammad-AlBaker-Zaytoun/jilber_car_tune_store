import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Always run fresh — never cache a health probe.
export const dynamic = 'force-dynamic';

/**
 * GET /api/health — liveness + DB readiness probe for the reverse proxy / uptime
 * monitor. Returns 200 when the database answers a trivial query, 503 otherwise.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { status: 'error', db: 'down', time: new Date().toISOString() },
      { status: 503 }
    );
  }
}
