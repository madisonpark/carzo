import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import FacebookPixel from "@/components/FacebookPixel";
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
  title: {
    template: "%s | Carzo - Find Your Perfect Vehicle",
    default: "Carzo - Browse Quality Vehicles from Trusted Dealerships"
  },
  description: "Search thousands of quality new and used vehicles from certified dealerships nationwide. Find your perfect car, truck, or SUV at Carzo.",
  keywords: ["used cars", "new cars", "vehicles for sale", "car dealerships", "buy cars online", "find vehicles", "carzo"],
  authors: [{ name: "Carzo" }],
  openGraph: {
    title: "Carzo - Find Your Perfect Vehicle",
    description: "Browse thousands of quality vehicles from trusted dealerships nationwide",
    type: "website",
    siteName: "Carzo",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carzo - Find Your Perfect Vehicle",
    description: "Browse thousands of quality vehicles from trusted dealerships",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-trust-bg text-trust-text`}
      >
        <FacebookPixel />
        <ThemeProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
