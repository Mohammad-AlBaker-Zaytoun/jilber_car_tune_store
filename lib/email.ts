/**
 * Thin email sender over the Resend REST API (no SDK dependency).
 *
 * Env-gated: if RESEND_API_KEY is unset the call is a logged no-op, so the app
 * works in development without an email provider. Set these to enable real mail:
 *   RESEND_API_KEY   — Resend API key
 *   EMAIL_FROM       — verified sender, e.g. "JILBER <orders@yourdomain.com>"
 *   ADMIN_EMAIL      — where admin alerts (new orders/quotes) are sent
 *
 * All sends are best-effort and never throw — callers fire-and-forget so email
 * latency/failure never blocks an API response.
 */

import { logger } from '@/lib/logger';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Escapes HTML special characters so user-supplied values (names, vehicle
 * details, free-text messages) can't inject markup into the email body. Apply to
 * every interpolated user value when building email HTML.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'JILBER Performance <onboarding@resend.dev>';

  if (!apiKey) {
    logger.info('email.disabled', { subject, to });
    return;
  }
  if (!to) return;

  // Email failures used to be console.error only, so a customer never receiving
  // their order confirmation was invisible in production. These now go through
  // the logger and therefore to whatever tracker is attached.
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logger.error('email.send_failed', undefined, {
        subject,
        to,
        status: res.status,
        body: (await res.text()).slice(0, 500),
      });
      return;
    }
    logger.debug('email.sent', { subject, to });
  } catch (err) {
    logger.error('email.send_error', err, { subject, to });
  }
}

/** Recipient for admin alerts, or null if not configured. */
export function adminEmail(): string | null {
  return process.env.ADMIN_EMAIL || null;
}

/** Wraps body content in a minimal branded HTML shell. */
export function emailLayout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#18181b">
    <h2 style="color:#0891b2">${heading}</h2>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
    <p style="font-size:12px;color:#71717a">JILBER Performance Engineering</p>
  </div>`;
}
