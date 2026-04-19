import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { NavProgress } from "@/components/ui/nav-progress";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaRe Match — Partner Qualification",
  description:
    "A private tool for the MaRe team: analyze, score, and craft bespoke partner microsites for luxury salon prospects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen antialiased">
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
