import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CartHydrate } from "@/lib/cartHydrate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageTransitionProvider } from "@/components/transition/PageTransitionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JILBER | Premium Car Tuning & Performance Engineering",
  description:
    "Precision ECU tuning, custom exhaust systems, suspension setup, and full race builds. Certified performance engineers delivering dyno-proven results.",
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
