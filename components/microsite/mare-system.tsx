import type { MicrositeMareSystemPoint } from "@/lib/types";

// Small decorative glyph per pillar — restrained, no iconography bloat.
const GLYPH: Record<string, string> = {
  "MaRe Eye": "◎",
  "MaRe Capsule": "◇",
  "Philip Martin's": "❋",
  "Ritual System": "⟡",
  "Training & Support": "✦",
};

export function MicrositeMareSystem({ points }: { points: MicrositeMareSystemPoint[] }) {
  return (
    <section className="mx-auto max-w-5xl px-8 py-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-charcoal-500">
        The MaRe System
      </p>
      <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight text-charcoal-900">
        A system — not a single product.
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-charcoal-700">
        Five components, operating together. Each is purposeful, and each was designed to hold a premium
        standard in daily use.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {points.map((p, i) => (
          <article key={i} className="card-surface p-8">
            <span className="font-serif text-3xl text-accent-500">{GLYPH[p.pillar] ?? "◇"}</span>
            <h3 className="mt-5 font-serif text-2xl tracking-tight text-charcoal-900">{p.pillar}</h3>
            <p className="mt-3 text-[15px] leading-[1.7] text-charcoal-700">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
