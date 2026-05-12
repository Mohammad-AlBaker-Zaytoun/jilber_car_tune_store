/**
 * Quote notification hooks.
 * TODO: wire up a real email provider (Resend, SendGrid, etc.) before production.
 */

import type { QuoteRequest } from '@/types/quotes';

export function notifyQuoteSubmitted(_quote: QuoteRequest): void {
  // TODO: send confirmation email to customer (_quote.customerEmail)
  //   Include: quote number, vehicle summary, service category, expected response time
}

export function notifyAdminNewQuote(_quote: QuoteRequest): void {
  // TODO: send new quote alert to admin
  //   Include: quote number, customer name, vehicle, service category, message
}

export function notifyCustomerQuoteUpdated(_quote: QuoteRequest): void {
  // TODO: send status update email to customer when status changes
  //   Include: quote number, new status, customer reply if any
}

export function notifyQuoteConvertedToOrder(_quote: QuoteRequest): void {
  // TODO: send conversion confirmation to customer when quote becomes an order
  //   Include: quote number, order reference
}
