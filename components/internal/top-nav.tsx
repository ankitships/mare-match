import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-bone-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Wordmark />
        <nav className="flex items-center gap-8 text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal-600">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            Intake
          </Link>
          <Link href="/prospects" className="hover:text-charcoal-900 transition-colors">
            Prospects
          </Link>
          <span className="text-charcoal-500">Internal · MaRe Team</span>
        </nav>
      </div>
    </header>
  );
}
