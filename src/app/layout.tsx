import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import MoodyBackground from "@/components/MoodyBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1 OF 1 AUTO",
  description: "Luxury automotive brokerage.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased relative">
        <MoodyBackground />
        {children}
      </body>
    </html>
  );
}
