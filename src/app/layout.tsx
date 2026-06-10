// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Nunito } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hum 🩷",
  description: "just us",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hum",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4785A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${nunito.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans antialiased" style={{ background: "#120C10" }}>       
         <div className="mx-auto max-w-mobile min-h-screen bg-hum-warm relative overflow-hidden">
        {children}
      </div>
      </body>
    </html>
  );
}
