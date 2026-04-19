import Image from "next/image";

export function MicrositeDifferent({ body }: { body: string }) {
  return (
    <section className="relative overflow-hidden bg-mare-extra-dark py-28 text-bone-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-[140%] w-[420px] opacity-[0.12]"
      >
        <Image src="/brand/pictorial-mark.png" alt="" fill sizes="420px" className="object-contain" />
      </div>
      <div className="mx-auto max-w-3xl px-8 text-center">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.28em] text-water-300">
          Why this feels different
        </p>
        <p className="mt-8 font-serif text-3xl leading-[1.35] tracking-tight text-bone-50 text-balance sm:text-[40px]">
          {body}
        </p>
      </div>
    </section>
  );
}
