import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { createInquiry } from '@/lib/inquiries';
import { notifyAdminNewInquiry } from '@/lib/contact-notifications';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import { verifyFormToken } from '@/lib/form-token';
import { logger } from '@/lib/logger';

const schema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(320).trim(),
  phone: z.string().max(50).trim().optional(),
  vehicle: z.string().max(500).trim().optional(),
  service: z.string().max(200).trim().optional(),
  message: z.string().max(4000).trim().optional(),
  // Honeypot — bots fill this; allow any string so Zod doesn't reject before the check
  _hp: z.string().optional(),
  /** Proof the sender actually loaded the form. See lib/form-token.ts. */
  formToken: z.string().optional(),
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
      logger.info('contact.rejected', { reason: 'honeypot' });
      return NextResponse.json({ ok: true });
    }

    /**
     * The honeypot above caught nothing during the August flood: 1,013 junk
     * inquiries arrived from clients POSTing straight here, which never see the
     * form and so never fill a hidden field. This token is the part they cannot
     * fabricate — it is signed by us and stamped with when the form was served.
     *
     * `too-fast` and `expired` are answered honestly with 400 so a real person
     * whose token went stale gets a retry (the client refetches once). A missing
     * or forged token is the automated case, and is answered with a bare 200 so
     * the sender learns nothing about why nothing happened.
     */
    const tokenFailure = await verifyFormToken(result.data.formToken);
    if (tokenFailure === 'missing' || tokenFailure === 'invalid') {
      logger.info('contact.rejected', { reason: tokenFailure });
      return NextResponse.json({ ok: true });
    }
    if (tokenFailure) {
      logger.info('contact.rejected', { reason: tokenFailure });
      return NextResponse.json(
        { error: 'Your form session expired. Please try again.', code: tokenFailure },
        { status: 400 }
      );
    }

    const { _hp: _hpIgnored, formToken: _tokenIgnored, ...data } = result.data;
    const inquiry = await createInquiry(data);

    // Fire-and-forget — never blocks the response
    after(() => notifyAdminNewInquiry(inquiry));

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('contact.post.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
