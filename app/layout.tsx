import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/navigation/ambient-background";
import { FloatingHeader } from "@/components/navigation/floating-header";
import { MobileNavDock } from "@/components/navigation/mobile-nav-dock";
import { SmartSearchModal } from "@/components/discovery/smart-search-modal";
import { LoginModal } from "@/components/auth/LoginModal";

export const metadata: Metadata = {
  title: "TheBookMyVenues — Premium Venue Discovery & Booking",
  description:
    "Book premium box cricket turfs, 4K private mini theatres, luxury celebration banquets, gaming lounges and swimming pools across India.",
  keywords: ["venue booking", "box cricket turf", "private theatre", "party hall", "swimming pool", "gaming lounge", "Hyderabad", "Warangal"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 pb-20 md:pb-8 selection:bg-brand-500 selection:text-white">
        <ClerkProvider>
          <AmbientBackground />
          <FloatingHeader />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
          </main>
          <MobileNavDock />
          <SmartSearchModal />
          <LoginModal />
        </ClerkProvider>
      </body>
    </html>
  );
}