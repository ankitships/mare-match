import Link from "next/link";
import Image from "next/image";

export function Wordmark({ href = "/", context }: { href?: string; context?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 text-mare-extra-dark"
      aria-label="MaRe Match"
    >
      <Image
        src="/brand/submark.png"
        alt=""
        width={28}
        height={28}
        className="shrink-0"
        priority
      />
      <span className="flex items-baseline gap-2">
        <span className="font-serif text-[22px] leading-none tracking-tight text-mare-key">
          MaRe
        </span>
        <span className="hidden h-[12px] w-px bg-mare-key/25 sm:block" />
        <span className="hidden font-display text-[10px] font-medium uppercase tracking-[0.24em] text-mare-dark/70 group-hover:text-mare-extra-dark transition-colors sm:inline">
          {context ?? "Match"}
        </span>
      </span>
    </Link>
  );
}
