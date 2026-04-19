import type { MicrositeImplementationItem } from "@/lib/types";

export function MicrositeImplementation({ items }: { items: MicrositeImplementationItem[] }) {
  return (
    <section className="mx-auto max-w-5xl px-8 py-28">
      <div className="grid gap-14 md:grid-cols-[260px,1fr]">
        <div>
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.28em] text-mare-key">
            What we'd need
          </p>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-mare-extra-dark">
            A short list — and we'd advise on each.
          </h2>
        </div>

        <ul className="divide-y divide-mare-light border-y border-mare-light">
          {items.map((it, i) => (
            <li key={i} className="grid grid-cols-[auto,1fr] items-start gap-6 py-6">
              <span className="pt-1 font-display text-[11px] font-medium uppercase tracking-[0.22em] text-mare-key/80 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-serif text-xl leading-tight tracking-tight text-mare-extra-dark">
                  {it.requirement}
                </p>
                <p className="mt-1.5 max-w-xl text-[14px] leading-[1.7] text-mare-dark/80">{it.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
