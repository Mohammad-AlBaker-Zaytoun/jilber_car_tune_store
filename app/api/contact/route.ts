import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInquiry } from '@/lib/inquiries';
import { notifyAdminNewInquiry } from '@/lib/contact-notifications';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).trim(),
  phone: z.string().max(50).trim().optional(),
  vehicle: z.string().max(500).trim().optional(),
  service: z.string().max(200).trim().optional(),
  message: z.string().max(4000).trim().optional(),
  // Honeypot — bots fill this; allow any string so Zod doesn't reject before the check
  _hp: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rl = rateLimit('contact:' + getClientIp(request), 5, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Honeypot check — silently succeed so bots don't know they were blocked
    if (result.data._hp) {
      return NextResponse.json({ ok: true });
    }

    const { _hp: _, ...data } = result.data;
    const inquiry = await createInquiry(data);

    // Fire-and-forget — never blocks the response
    void notifyAdminNewInquiry(inquiry);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
