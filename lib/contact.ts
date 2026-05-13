/**
 * Contact link helpers — pure functions, no side effects.
 * Structure click handlers with data attributes so analytics can be layered on later.
 */

export interface PublicContactInfo {
  contactPhone: string;
  contactEmail: string;
  address: string;
  whatsappNumber: string;
  googleMapsUrl: string;
  workingHours: string;
  enableFloatingWhatsApp: boolean;
  enableFloatingCall: boolean;
  defaultWhatsAppMessage: string;
  quoteWhatsAppMessage: string;
  productWhatsAppMessage: string;
}

/** Strip everything except digits for wa.me links (e.g. "+961 70 123 456" → "96170123456"). */
export function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Strip non-tel characters for tel: links, keeping leading + */
export function normalizePhoneForTel(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

/**
 * Build a wa.me URL with optional pre-filled message.
 * Returns null when the number is empty/invalid after normalization.
 */
export function buildWhatsAppUrl(rawNumber: string, message?: string): string | null {
  const digits = normalizeWhatsAppNumber(rawNumber);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

/** Build a tel: link. Returns null when phone is empty. */
export function buildTelUrl(rawPhone: string): string | null {
  const normalized = normalizePhoneForTel(rawPhone);
  if (!normalized) return null;
  return `tel:${normalized}`;
}

/** Build a mailto: link with optional subject and body. */
export function buildMailtoUrl(email: string, subject?: string, body?: string): string | null {
  if (!email?.trim()) return null;
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return params.length ? `mailto:${email}?${params.join('&')}` : `mailto:${email}`;
}

/**
 * Interpolate a WhatsApp message template.
 * Supports {productName}, {productPrice}, {currency} placeholders.
 */
export function interpolateMessage(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

/** Build the product inquiry WhatsApp message. */
export function buildProductWhatsAppMessage(
  template: string,
  product: { name: string; price?: number; currency?: string }
): string {
  return interpolateMessage(template, {
    productName: product.name,
    productPrice: product.price != null ? product.price.toLocaleString() : '',
    currency: product.currency ?? '',
  });
}
