import type { MicrositeImplementationItem } from "@/lib/types";
import { Check } from "lucide-react";

export function MicrositeImplementation({ items }: { items: MicrositeImplementationItem[] }) {
  return (
    <section className="mx-auto max-w-5xl px-8 py-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-charcoal-500">
        Implementation
      </p>
      <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight text-charcoal-900">
        What's needed to bring MaRe to your salon.
      </h2>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={i} className="card-surface flex items-start gap-4 p-6">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-500/30 bg-accent-500/5 text-accent-600">
              <Check className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-serif text-lg tracking-tight text-charcoal-900">{it.requirement}</p>
              <p className="mt-1 text-[14px] leading-[1.65] text-charcoal-700">{it.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
