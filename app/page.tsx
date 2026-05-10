import Navbar from "@/components/Navbar";
import ScrollFrameHero from "@/components/ScrollFrameHero";
import ServicesSection from "@/components/ServicesSection";
import PackagesSection from "@/components/PackagesSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import GallerySection from "@/components/GallerySection";
import ProcessSection from "@/components/ProcessSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
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
