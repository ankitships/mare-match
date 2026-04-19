import type { Metadata } from "next";
import { Albert_Sans, Playfair_Display, Manrope } from "next/font/google";
import { NavProgress } from "@/components/ui/nav-progress";
import "./globals.css";

// MaRe brand fonts — Albert Sans for body, Playfair Display for titles,
// Manrope for complementary (numbers + sub-heads). All three are listed in
// the MaRe Brand Guidelines (Assets/MaRe Brand Guidelines.pdf, page 5).
const sans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const display = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MaRe Match · Private",
  description:
    "Private tool for the MaRe team. Analyze a salon, score the fit, draft the partner page.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${display.variable}`}>
      <body className="min-h-screen antialiased">
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
