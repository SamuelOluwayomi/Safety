import type { Metadata } from "next";
import { Playfair_Display, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Web3Provider from "../components/providers/Web3Provider";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Safety // Confidential Treasury Layer for Safe",
  description: "Confidential payout module for Safe multisig accounts powered by iExec Nox TEE.",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-charcoal font-sans selection:bg-accent-red selection:text-white">
        <Web3Provider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <Toaster position="bottom-right" richColors closeButton />
        </Web3Provider>
      </body>
    </html>
  );
}
