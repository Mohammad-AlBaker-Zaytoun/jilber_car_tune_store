'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { useContactInfo } from '@/lib/useContactInfo';
import { buildWhatsAppUrl, buildTelUrl } from '@/lib/contact';

interface Props {
  heading: string;
  body: string;
  whatsappMessage?: string;
  /** Override which actions to show; defaults to both when numbers exist */
  showWhatsApp?: boolean;
  showCall?: boolean;
}

export default function SupportCtaCard({
  heading,
  body,
  whatsappMessage,
  showWhatsApp = true,
  showCall = true,
}: Props) {
  const { info, loading } = useContactInfo();

  const hasWa = showWhatsApp && !!info.whatsappNumber;
  const hasCall = showCall && !!info.contactPhone;

  if (loading || (!hasWa && !hasCall)) return null;

  const message = whatsappMessage || info.defaultWhatsAppMessage;
  const waUrl = hasWa ? buildWhatsAppUrl(info.whatsappNumber, message || undefined) : null;
  const telUrl = hasCall ? buildTelUrl(info.contactPhone) : null;

  return (
    <div className="border border-zinc-800/50 bg-zinc-900/20 p-5 flex flex-col gap-4">
      <div>
        <p className="text-xs font-black text-white tracking-wide">{heading}</p>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{body}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-contact-action="whatsapp-click"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-200"
          >
            <MessageCircle size={11} aria-hidden="true" />
            WhatsApp
          </a>
        )}
        {telUrl && (
          <a
            href={telUrl}
            data-contact-action="phone-click"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-200"
          >
            <Phone size={11} aria-hidden="true" />
            Call Us
          </a>
        )}
      </div>
    </div>
  );
}
