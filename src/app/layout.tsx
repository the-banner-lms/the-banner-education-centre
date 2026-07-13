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
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/queries';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(supabase) : null;

  const isPending = profile?.approval_status === 'pending';
  const isRejected = profile?.approval_status === 'rejected';

  let content = children;

  if (user && (isPending || isRejected)) {
    content = (
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isPending ? 'Account Pending Approval' : 'Account Rejected'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isPending 
              ? 'Your account has been created successfully, but an administrator needs to approve your registration before you can access the platform.'
              : 'Unfortunately, your registration has been rejected by an administrator. Please contact support for more information.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <PresenceProvider>
          <Navbar />
          <main className="flex-grow">
            {content}
          </main>
        </PresenceProvider>
      </body>
    </html>
  );
}
