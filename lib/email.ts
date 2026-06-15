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

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'JILBER Performance <onboarding@resend.dev>';

  if (!apiKey) {
    console.info(`[email] disabled (set RESEND_API_KEY) — would send "${subject}" to ${to}`);
    return;
  }
  if (!to) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[email] send failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('[email] send error', err);
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
