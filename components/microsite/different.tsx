export function MicrositeDifferent({ body }: { body: string }) {
  return (
    <section className="mx-auto max-w-5xl px-8 py-20">
      <div className="hairline" />
      <div className="mx-auto mt-16 max-w-3xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent-600">
          Why this feels different
        </p>
        <p className="mt-6 font-serif text-3xl leading-[1.35] tracking-tight text-charcoal-900 text-balance">
          {body}
        </p>
      </div>
    </section>
  );
}
