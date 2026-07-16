import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/lib/SettingsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata: Metadata = {
  title: "AH Brand Store",
  description: "AH Brand - Premium Bag Inventory System",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon-192.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AH Brand Store"
  },
  openGraph: {
    title: "AH Brand Store",
    description: "نظام إدارة متجر AH Brand",
    siteName: "AH Brand Store",
    type: "website",
    images: [
    {
      url: "/icon.png",
      width: 1024,
      height: 1024,
      alt: "AH Brand Logo"
    }]

  },
  twitter: {
    card: "summary_large_image",
    title: "AH Brand Store",
    description: "نظام إدارة متجر AH Brand",
    images: ["/icon.png"]
  }
};

import Navbar from "@/components/Navbar";
import ProgressBarProvider from "@/components/ProgressBar";

export default function RootLayout({
  children


}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="ar" dir="rtl" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ProgressBarProvider>
          <SettingsProvider>
            <Navbar />
            {children}
          </SettingsProvider>
        </ProgressBarProvider>
      </body>
    </html>);

}
