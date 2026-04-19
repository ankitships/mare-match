import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-baseline gap-2 text-charcoal-900"
      aria-label="MaRe Match"
    >
      <span className="font-serif text-[22px] leading-none tracking-tight">MaRe</span>
      <span className="h-[14px] w-px bg-charcoal-900/25" />
      <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-charcoal-600 group-hover:text-charcoal-900 transition-colors">
        Match
      </span>
    </Link>
  );
}
