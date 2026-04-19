import Image from "next/image";
import type { MicrositeMareSystemPoint } from "@/lib/types";

// Small serif numeral in place of iconography — feels more editorial,
// lets the brand's own pictorial mark carry the visual language above.
const PILLAR_ORDER = [
  "MaRe Eye",
  "MaRe Capsule",
  "Philip Martin's",
  "Ritual System",
  "Training & Support",
] as const;

export function MicrositeMareSystem({ points }: { points: MicrositeMareSystemPoint[] }) {
  // Reorder to guarantee the canonical sequence even if the LLM shuffled them
  const byPillar = new Map(points.map((p) => [p.pillar, p]));
  const ordered = PILLAR_ORDER.map((name) => byPillar.get(name)).filter(Boolean) as MicrositeMareSystemPoint[];

  return (
    <section className="relative overflow-hidden bg-bone-50 py-28">
      {/* Faint tiled pictorial mark wash as background texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045]"
        style={{
          backgroundImage: `url(/brand/pictorial-mark.png)`,
          backgroundRepeat: "repeat",
          backgroundSize: "160px",
        }}
      />

      <div className="mx-auto max-w-5xl px-8">
        <div className="grid items-end gap-10 md:grid-cols-[1fr,auto]">
          <div>
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.28em] text-mare-key">
              The MaRe System
            </p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl font-medium leading-[1.1] tracking-tight text-mare-extra-dark sm:text-5xl">
              Five parts. One system.
            </h2>
          </div>
          <div className="relative hidden h-20 w-16 shrink-0 md:block">
            <Image src="/brand/pictorial-mark.png" alt="" fill sizes="64px" className="object-contain opacity-80" />
          </div>
        </div>

        <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-mare-dark/85">
          Each part is specific. Together they hold a single standard.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {ordered.map((p, i) => (
            <article
              key={p.pillar}
              className="group relative flex flex-col gap-5 rounded-sm border border-mare-light bg-white/80 p-8 premium-shadow backdrop-blur-sm transition-colors hover:border-mare-key/30"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl leading-tight tracking-tight text-mare-key">
                  {p.pillar}
                </h3>
                <span className="font-display text-[11px] font-medium uppercase tracking-[0.24em] text-mare-dark/40 tabular-nums">
                  0{i + 1}
                </span>
              </div>
              <p className="text-[15px] leading-[1.75] text-mare-dark/85">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
