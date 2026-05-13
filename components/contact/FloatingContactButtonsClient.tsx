'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, buildTelUrl } from '@/lib/contact';
import type { PublicContactInfo } from '@/lib/contact';

interface Props {
  info: PublicContactInfo;
}

export default function FloatingContactButtonsClient({ info }: Props) {
  const showWa = info.enableFloatingWhatsApp && !!info.whatsappNumber;
  const showCall = info.enableFloatingCall && !!info.contactPhone;

  if (!showWa && !showCall) return null;

  const waUrl = buildWhatsAppUrl(info.whatsappNumber, info.defaultWhatsAppMessage || undefined);
  const telUrl = buildTelUrl(info.contactPhone);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-3"
      aria-label="Quick contact"
    >
      {showCall && telUrl && (
        <a
          href={telUrl}
          aria-label="Call us"
          data-contact-action="phone-click"
          className="group flex items-center gap-0 overflow-hidden rounded-full border border-zinc-700/60 bg-zinc-900/80 backdrop-blur-md shadow-xl hover:border-cyan-400/50 hover:bg-zinc-900 transition-all duration-300"
        >
          <span className="max-w-0 group-hover:max-w-[8rem] overflow-hidden transition-all duration-300 ease-out">
            <span className="pl-4 pr-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider whitespace-nowrap">
              Call Us
            </span>
          </span>
          <span className="flex items-center justify-center w-12 h-12">
            <Phone size={18} className="text-cyan-400" aria-hidden="true" />
          </span>
        </a>
      )}

      {showWa && waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          data-contact-action="whatsapp-click"
          className="group flex items-center gap-0 overflow-hidden rounded-full border border-zinc-700/60 bg-zinc-900/80 backdrop-blur-md shadow-xl hover:border-cyan-400/50 hover:bg-zinc-900 transition-all duration-300"
        >
          <span className="max-w-0 group-hover:max-w-[10rem] overflow-hidden transition-all duration-300 ease-out">
            <span className="pl-4 pr-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider whitespace-nowrap">
              WhatsApp
            </span>
          </span>
          <span className="flex items-center justify-center w-12 h-12">
            <MessageCircle size={18} className="text-cyan-400" aria-hidden="true" />
          </span>
        </a>
      )}
    </div>
  );
}
