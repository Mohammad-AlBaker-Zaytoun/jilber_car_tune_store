import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ScrollFrameHero from "@/components/ScrollFrameHero";
import ServicesSection from "@/components/ServicesSection";
import PackagesSection from "@/components/PackagesSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import GallerySection from "@/components/GallerySection";
import ProcessSection from "@/components/ProcessSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { buildOrganizationJsonLd, safeJsonLd } from "@/lib/seo/helpers";
import { siteConfig } from "@/lib/seo/site-config";

export const metadata: Metadata = {
  title: {
    absolute: siteConfig.siteName,
  },
  description:
    "High-end automotive tuning, performance upgrades, diagnostics, exhaust systems, suspension tuning, custom builds, and premium car transformation services.",
  alternates: {
    canonical: siteConfig.siteUrl,
  },
  openGraph: {
    title: siteConfig.siteName,
    description:
      "High-end automotive tuning, performance upgrades, diagnostics, exhaust systems, suspension tuning, custom builds, and premium car transformation services.",
    url: siteConfig.siteUrl,
    type: "website",
  },
};

export default function Home() {
  const orgJsonLd = buildOrganizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }}
      />
      <Navbar />
      <main>
        <ScrollFrameHero />
        <ServicesSection />
        <PackagesSection />
        <WhyChooseUsSection />
        <GallerySection />
        <ProcessSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
