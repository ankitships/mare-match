import type { MicrositeReason } from "@/lib/types";

export function MicrositeWhySelected({ reasons }: { reasons: MicrositeReason[] }) {
  return (
    <section className="mx-auto max-w-5xl px-8 py-20">
      <div className="grid gap-10 md:grid-cols-[240px,1fr]">
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-charcoal-900">
          Why you were selected
        </h2>
        <ol className="space-y-8">
          {reasons.map((r, i) => (
            <li key={i} className="grid grid-cols-[auto,1fr] gap-5">
              <span className="pt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-serif text-xl leading-tight tracking-tight text-charcoal-900">
                  {r.headline}
                </h3>
                <p className="mt-2 max-w-xl text-[15px] leading-[1.7] text-charcoal-700">{r.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="hairline mt-16" />
    </section>
  );
}
