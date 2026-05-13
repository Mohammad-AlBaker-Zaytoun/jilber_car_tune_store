import { getSettings } from '@/lib/settings.dev';
import type { PublicContactInfo } from '@/lib/contact';
import FloatingContactButtonsClient from './FloatingContactButtonsClient';

export default function FloatingContactButtons() {
  const s = getSettings();
  const info: PublicContactInfo = {
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    address: s.address,
    whatsappNumber: s.whatsappNumber,
    googleMapsUrl: s.googleMapsUrl,
    workingHours: s.workingHours,
    enableFloatingWhatsApp: s.enableFloatingWhatsApp,
    enableFloatingCall: s.enableFloatingCall,
    defaultWhatsAppMessage: s.defaultWhatsAppMessage,
    quoteWhatsAppMessage: s.quoteWhatsAppMessage,
    productWhatsAppMessage: s.productWhatsAppMessage,
  };
  return <FloatingContactButtonsClient info={info} />;
}
