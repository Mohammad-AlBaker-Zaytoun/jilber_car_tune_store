'use client';

import { useState, useEffect } from 'react';
import type { PublicContactInfo } from '@/lib/contact';

const EMPTY: PublicContactInfo = {
  contactPhone: '',
  contactEmail: '',
  address: '',
  whatsappNumber: '',
  googleMapsUrl: '',
  workingHours: '',
  enableFloatingWhatsApp: false,
  enableFloatingCall: false,
  defaultWhatsAppMessage: '',
  quoteWhatsAppMessage: '',
  productWhatsAppMessage: '',
};

let cache: PublicContactInfo | null = null;

export function useContactInfo(): { info: PublicContactInfo; loading: boolean } {
  const [info, setInfo] = useState<PublicContactInfo>(cache ?? EMPTY);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    if (cache !== null) return;
    fetch('/api/contact-info')
      .then((r) => r.json())
      .then((data: PublicContactInfo) => {
        cache = data;
        setInfo(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { info, loading };
}
