import type { ContactInquiry } from '@/types/admin';
import { sendEmail, adminEmail, emailLayout, escapeHtml } from '@/lib/email';

export async function notifyAdminNewInquiry(inquiry: ContactInquiry): Promise<void> {
  const admin = adminEmail();
  if (!admin) return;

  // Strip newlines so a crafted name can't inject extra email headers
  const safeName = inquiry.name.replace(/[\r\n]/g, ' ');

  // Only include the admin link when we have an absolute base URL — a relative
  // path is meaningless inside an email client
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const adminLink = siteUrl
    ? `<p style="margin-top:16px"><a href="${siteUrl}/admin/inquiries" style="color:#0891b2">View in admin →</a></p>`
    : '';

  await sendEmail({
    to: admin,
    subject: `New contact inquiry from ${safeName}`,
    html: emailLayout(
      'New contact inquiry',
      `<p><strong>${escapeHtml(inquiry.name)}</strong> (${escapeHtml(inquiry.email)}${inquiry.phone ? `, ${escapeHtml(inquiry.phone)}` : ''})</p>
       ${inquiry.vehicle ? `<p>Vehicle: ${escapeHtml(inquiry.vehicle)}</p>` : ''}
       ${inquiry.service ? `<p>Service: ${escapeHtml(inquiry.service)}</p>` : ''}
       ${inquiry.message ? `<p>${escapeHtml(inquiry.message)}</p>` : ''}
       ${adminLink}`
    ),
  });
}
