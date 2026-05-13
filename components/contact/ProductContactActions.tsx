'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { useContactInfo } from '@/lib/useContactInfo';
import { buildWhatsAppUrl, buildTelUrl, buildProductWhatsAppMessage } from '@/lib/contact';

interface Props {
  product: {
    name: string;
    slug: string;
    price?: number;
    currency?: string;
  };
}

export default function ProductContactActions({ product }: Props) {
  const { info, loading } = useContactInfo();

  if (loading) return null;

  const hasWa = !!info.whatsappNumber;
  const hasCall = !!info.contactPhone;

  if (!hasWa && !hasCall) return null;

  const message = info.productWhatsAppMessage
    ? buildProductWhatsAppMessage(info.productWhatsAppMessage, product)
    : `Hello, I am interested in ${product.name}. Can you provide more details?`;

  const waUrl = hasWa ? buildWhatsAppUrl(info.whatsappNumber, message) : null;
  const telUrl = hasCall ? buildTelUrl(info.contactPhone) : null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-contact-action="product-whatsapp-inquiry"
          data-product={product.slug}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 bg-zinc-900/40 hover:border-cyan-400/40 hover:text-cyan-400 text-zinc-400 font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-200"
        >
          <MessageCircle size={12} aria-hidden="true" />
          Ask on WhatsApp
        </a>
      )}
      {telUrl && (
        <a
          href={telUrl}
          data-contact-action="phone-click"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 bg-zinc-900/40 hover:border-cyan-400/40 hover:text-cyan-400 text-zinc-400 font-black text-[10px] tracking-[0.2em] uppercase transition-all duration-200"
        >
          <Phone size={12} aria-hidden="true" />
          Call for Availability
        </a>
      )}
    </div>
  );
}
