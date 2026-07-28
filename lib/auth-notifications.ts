/**
 * Account-security emails.
 *
 * These go to the *account holder*, never to whoever made the request — that is
 * what lets the API answer neutrally without leaving the real user in the dark.
 */

import { sendEmail, emailLayout, escapeHtml } from '@/lib/email';
import { siteConfig } from '@/lib/seo/site-config';

/**
 * Someone tried to sign up with an email that already has an account.
 *
 * Sent instead of telling the requester "this account exists" (an enumeration
 * oracle). Wording assumes the recipient is the legitimate owner and is careful
 * not to imply anything was compromised — nothing was; a signup form was filled
 * in with their address.
 */
export async function notifyRegistrationAttemptOnExistingAccount(
  name: string,
  email: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'You already have a JILBER account',
    html: emailLayout(
      'You already have an account',
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Someone just used this email address to sign up at JILBER Performance.
          You already have an account, so we did not create a second one and
          nothing has changed.</p>
       <p><strong>If this was you</strong>, just sign in instead:</p>
       <p><a href="${siteConfig.siteUrl}/signin"
             style="display:inline-block;padding:10px 18px;background:#0891b2;color:#fff;text-decoration:none;font-weight:700">
          Sign in</a></p>
       <p>Forgotten your password? Reset it here:
          <a href="${siteConfig.siteUrl}/forgot-password">${siteConfig.siteUrl}/forgot-password</a></p>
       <p style="color:#71717a;font-size:13px">If this wasn't you, you can safely
          ignore this email — your account and password are unchanged.</p>`
    ),
  });
}
