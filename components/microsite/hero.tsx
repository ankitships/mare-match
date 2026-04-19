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
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bone-100 via-bone-50 to-bone-50" />
      <div className="mx-auto max-w-5xl px-8 pb-24 pt-20 sm:pt-28">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent-600">
          Prepared for {prospectName}
          {location ? ` · ${location}` : ""}
        </p>

        <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-[64px] text-balance">
          {title}
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-[1.65] text-charcoal-700 text-balance">
          {subtitle}
        </p>

        <div className="hairline mt-12" />
      </div>
    </section>
  );
}
