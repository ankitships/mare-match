import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { store } from "@/lib/db";
import { MicrositeHero } from "@/components/microsite/hero";
import { MicrositeWhySelected } from "@/components/microsite/why-selected";
import { MicrositeMareSystem } from "@/components/microsite/mare-system";
import { MicrositeRoi } from "@/components/microsite/roi";
import { MicrositeImplementation } from "@/components/microsite/implementation";
import { MicrositeDifferent } from "@/components/microsite/different";
import { MicrositeNextStep } from "@/components/microsite/next-step";
import { MicrositeFrame } from "@/components/microsite/frame";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const microsite = await store.getMicrositeBySlug(slug);
  if (!microsite) return { title: "Private · MaRe" };
  return {
    title: `${microsite.hero_title} — MaRe`,
    description: microsite.hero_subtitle,
    robots: { index: false, follow: false },
  };
}

export default async function PartnerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const microsite = await store.getMicrositeBySlug(slug);
  if (!microsite) return notFound();

  const prospect = await store.getProspect(microsite.prospect_id);
  if (!prospect) return notFound();

  return (
    <MicrositeFrame prospectName={prospect.name}>
      <MicrositeHero
        title={microsite.hero_title}
        subtitle={microsite.hero_subtitle}
        prospectName={prospect.name}
        city={prospect.city}
        state={prospect.state}
      />

      <MicrositeWhySelected
        reasons={microsite.why_selected_json}
        imageUrls={microsite.theme_json?.prospect_images ?? []}
      />

      <MicrositeMareSystem points={microsite.mare_system_json} />

      <MicrositeRoi prospectName={prospect.name} />

      <MicrositeImplementation items={microsite.implementation_json} />

      <MicrositeDifferent body={microsite.why_different_body} />

      <MicrositeNextStep
        ctaLabel={microsite.next_step_json.cta_label}
        message={microsite.next_step_json.message}
      />
    </MicrositeFrame>
  );
}
