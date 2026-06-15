/**
 * Quote notification hooks. Sends email via lib/email (env-gated by RESEND_API_KEY).
 * Callers fire-and-forget — these never throw.
 */

import type { QuoteRequest } from '@/types/quotes';
import { sendEmail, adminEmail, emailLayout } from '@/lib/email';

function quoteSummary(q: QuoteRequest): string {
  return `<p>Quote: <strong>${q.quoteNumber}</strong></p>
    <p>Service: ${q.serviceCategory}</p>
    <p>Vehicle: ${q.vehicleMake} ${q.vehicleModel} (${q.vehicleYear})</p>`;
}

export async function notifyQuoteSubmitted(quote: QuoteRequest): Promise<void> {
  await sendEmail({
    to: quote.customerEmail,
    subject: `Quote request received — ${quote.quoteNumber}`,
    html: emailLayout(
      'We received your request',
      `<p>Hi ${quote.customerName}, thanks for your quote request. Our team will review it and get back to you soon.</p>${quoteSummary(quote)}`
    ),
  });
}

export async function notifyAdminNewQuote(quote: QuoteRequest): Promise<void> {
  const admin = adminEmail();
  if (!admin) return;
  await sendEmail({
    to: admin,
    subject: `New quote request — ${quote.quoteNumber}`,
    html: emailLayout(
      'New quote request',
      `<p>${quote.customerName} (${quote.customerEmail}, ${quote.customerPhone})</p>${quoteSummary(quote)}
       <p>${quote.message}</p>`
    ),
  });
}

export async function notifyCustomerQuoteUpdated(quote: QuoteRequest): Promise<void> {
  await sendEmail({
    to: quote.customerEmail,
    subject: `Update on your quote — ${quote.quoteNumber}`,
    html: emailLayout(
      'Your quote was updated',
      `<p>Hi ${quote.customerName}, there's an update on your quote request.</p>${quoteSummary(quote)}
       ${quote.customerReply ? `<p>${quote.customerReply}</p>` : ''}`
    ),
  });
}

export async function notifyQuoteConvertedToOrder(quote: QuoteRequest): Promise<void> {
  await sendEmail({
    to: quote.customerEmail,
    subject: `Your quote is now an order — ${quote.quoteNumber}`,
    html: emailLayout(
      'Quote converted to order',
      `<p>Hi ${quote.customerName}, your quote has been converted into a service order. We'll be in touch with next steps.</p>${quoteSummary(quote)}`
    ),
  });
}
