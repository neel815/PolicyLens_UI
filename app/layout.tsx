import type { Metadata } from "next";
import {
  Instrument_Serif,
  DM_Sans,
} from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/Navbar';
import { PageLoader } from '@/components/PageLoader';

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
      <body className="min-h-screen bg-[#F7F6F2] font-[family-name:var(--font-sans)]">
        <PageLoader />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
