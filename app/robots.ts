import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo/site-config';
import { absoluteUrl } from '@/lib/seo/helpers';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/account',
        '/account/',
        '/checkout',
        '/checkout/',
        '/cart',
        '/cart/',
        '/api/',
        '/signin',
        '/signup',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: siteConfig.siteUrl,
  };
}
