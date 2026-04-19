import Image from "next/image";

export function MicrositeHero({
  title,
  subtitle,
  prospectName,
  city,
  state,
}: {
  title: string;
  subtitle: string;
  prospectName: string;
  city?: string;
  state?: string;
}) {
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <section className="relative overflow-hidden border-b border-mare-light/60">
      {/* Background wash — Light fading to slightly warmer tone */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-mare-light via-[#ecebe6] to-bone-50" />

      {/* Pictorial mark as a giant, faint decoration on the right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-[-8%] hidden h-[140%] w-[520px] opacity-30 md:block"
      >
        <Image
          src="/brand/pictorial-mark.png"
          alt=""
          fill
          sizes="520px"
          className="object-contain"
          priority
        />
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-8 pb-28 pt-24 sm:pt-32 md:grid-cols-[1fr,auto] md:items-end">
        <div>
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.28em] text-mare-key">
            For {prospectName}
            {location ? ` · ${location}` : ""}
          </p>

          <h1 className="mt-7 max-w-3xl font-serif text-[52px] font-medium leading-[1.04] tracking-tight text-mare-extra-dark text-balance sm:text-[68px]">
            {title}
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-[1.7] text-mare-dark/85 text-balance">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="hairline mx-auto max-w-5xl" />
    </section>
  );
}
