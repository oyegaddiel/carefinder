import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";

// Playfair Display — used for headings
// We're loading the 400 and 700 weights (regular and bold)
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair", // This creates a CSS variable we can use anywhere
  display: "swap", // Shows fallback font while loading — better UX
});

// DM Sans — used for body text, labels, buttons
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carefinder — Find Healthcare in Nigeria",
  description:
    "Search and discover verified hospitals and clinics across Nigeria.",
};

export default function RootLayout({
  children,
}: {
  // children is the page content — React will fill this in automatically
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      {/*
        We attach both font variables to <html> so they're available
        everywhere in the app via CSS variables
      */}
      <body className={`${playfair.variable} ${dmSans.variable} antialiased`}>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
