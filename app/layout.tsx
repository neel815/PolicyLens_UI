import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Instrument_Serif,
  DM_Sans,
} from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/Navbar';
import { PageLoader } from '@/components/PageLoader';
import { ThemeScript } from '@/components/ThemeScript';

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  weight: "400",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PolicyLens - AI Policy Analysis",
  description: "Analyze and simulate insurance policies with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
      </head>
      <body className="min-h-screen bg-background font-[family-name:var(--font-sans)] transition-colors duration-300">
        <ThemeScript />
        <Suspense fallback={null}>
          <PageLoader />
        </Suspense>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
