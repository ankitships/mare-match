import Image from "next/image";
import type { MicrositeReason } from "@/lib/types";

export function MicrositeWhySelected({
  reasons,
  imageUrls = [],
}: {
  reasons: MicrositeReason[];
  /** Optional prospect-owned imagery pulled from their site. Displayed as a small editorial strip. */
  imageUrls?: string[];
}) {
  const gallery = imageUrls.slice(0, 3);

  return (
    <section className="mx-auto max-w-5xl px-8 py-28">
      <div className="grid gap-14 md:grid-cols-[260px,1fr]">
        <div>
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.28em] text-mare-key">
            A closer read
          </p>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] tracking-tight text-mare-extra-dark">
            Why you were selected.
          </h2>
        </div>

        <ol className="space-y-10">
          {reasons.map((r, i) => (
            <li key={i} className="grid grid-cols-[auto,1fr] gap-6">
              <span className="pt-1 font-display text-[11px] font-medium uppercase tracking-[0.22em] text-mare-key/80">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-serif text-2xl leading-[1.2] tracking-tight text-mare-extra-dark">
                  {r.headline}
                </h3>
                <p className="mt-3 max-w-xl text-[15px] leading-[1.75] text-mare-dark/85">{r.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {gallery.length > 0 && (
        <div className="mt-20">
          <div className="hairline mb-10" />
          <p className="mb-6 font-display text-[10px] font-medium uppercase tracking-[0.28em] text-mare-dark/60">
            From your site
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {gallery.map((src, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] overflow-hidden rounded-sm bg-mare-light/50"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
