import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CartHydrate } from "@/lib/cartHydrate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageTransitionProvider } from "@/components/transition/PageTransitionProvider";
import { siteConfig } from "@/lib/seo/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.siteDescription,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.siteName,
  authors: [{ name: siteConfig.businessName }],
  creator: siteConfig.businessName,
  publisher: siteConfig.businessName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [
      {
        url: siteConfig.defaultOgImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.siteName} — Performance Engineering`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.siteName,
    description: siteConfig.siteDescription,
    images: [siteConfig.defaultOgImage],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100 overflow-x-hidden">
        <AuthProvider>
          <ToastProvider>
            <PageTransitionProvider>
              <CartHydrate />
              {children}
            </PageTransitionProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
