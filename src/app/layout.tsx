import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Banner Education Centre",
  description: "LMS and Activities Portal",
  icons: {
    icon: '/logo.png?v=4',
    shortcut: '/favicon.ico?v=4',
    apple: '/logo.png?v=4',
  },
};

import Navbar from "@/components/Navbar";
import { PresenceProvider } from "@/components/PresenceTracker";
import NextTopLoader from 'nextjs-toploader';
import Loading from '@/app/loading';
import AuthGuard from '@/components/AuthGuard';
import { Suspense } from "react";

function NavbarFallback() {
  return (
    <div
      className="sticky top-0 z-50 h-20 shrink-0 border-b border-banner-light/20 bg-white/80 backdrop-blur-md md:h-24"
      aria-hidden="true"
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <NextTopLoader color="#0f6630" height={4} showSpinner={false} />
        
        <PresenceProvider>
          <Suspense fallback={<NavbarFallback />}>
            <Navbar />
          </Suspense>
          <main className="flex-grow">
            <Suspense fallback={<Loading />}>
              <AuthGuard>
                {children}
              </AuthGuard>
            </Suspense>
          </main>
        </PresenceProvider>
      </body>
    </html>
  );
}
