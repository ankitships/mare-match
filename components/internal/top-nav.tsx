import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-mare-light/60 bg-bone-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Wordmark context="Match" />
        <nav className="flex items-center gap-7 font-display text-[10px] font-medium uppercase tracking-[0.22em] text-mare-dark/60">
          <Link href="/" className="hover:text-mare-extra-dark transition-colors">
            Intake
          </Link>
          <Link href="/prospects" className="hover:text-mare-extra-dark transition-colors">
            Prospects
          </Link>
          <span className="hidden text-mare-dark/50 sm:inline">Internal</span>
        </nav>
      </div>
    </header>
  );
}
