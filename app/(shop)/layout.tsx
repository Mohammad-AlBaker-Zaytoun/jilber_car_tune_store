import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { ReactNode } from 'react';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
