const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const siteConfig = {
  siteName: 'JILBER Performance Engineering',
  siteDescription:
    'Premium car tuning, performance hardware, diagnostics, custom builds, exhaust systems, suspension upgrades, and automotive performance services.',
  siteUrl,
  // TODO: Add the default OG image at public/og/default-og.jpg (1200×630 px, JPEG)
  defaultOgImage: '/og/default-og.jpg',
  businessName: 'JILBER Performance Engineering',
  // Placeholders — update with real values before production
  phone: '+1 555 000 0000',
  email: 'info@jilber.com',
  address: '123 Performance Way, Automotive District',
  social: {
    twitter: '',
    instagram: '',
    facebook: '',
  },
  locale: 'en_US',
  currency: 'USD',
  themeColor: '#09090b',
  keywords: [
    'car tuning',
    'ECU tune',
    'performance parts',
    'exhaust system',
    'suspension upgrade',
    'brake upgrade',
    'wheel set',
    'dyno tuning',
    'stage 1 tune',
    'stage 2 tune',
    'automotive performance',
    'custom build',
    'track setup',
    'JILBER',
  ],
} as const;
