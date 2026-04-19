import Link from "next/link";
import { notFound } from "next/navigation";

import { TopNav } from "@/components/internal/top-nav";
import { OutreachStudio } from "@/components/outreach/studio";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OutreachStudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prospect = await store.getProspectBySlug(slug);
  if (!prospect) return notFound();
  const outreach = await store.getLatestOutreach(prospect.id);

  if (!outreach) {
    return (
      <>
        <TopNav />
        <main className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
            <Link href={`/prospects/${slug}`}>{prospect.name}</Link> · Outreach
          </p>
          <h1 className="mt-4 font-serif text-4xl tracking-tight">No outreach yet</h1>
          <p className="mt-3 text-charcoal-600">
            Return to the review page and click <em>Generate outreach</em> after the microsite exists.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
          <Link href={`/prospects/${slug}`} className="hover:text-charcoal-900">
            {prospect.name}
          </Link>{" "}
          · Outreach studio
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">Outreach studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-charcoal-600">
          Four artifacts, each structured as Hook → Value → Guardrail. Edit freely; every save creates a version.
        </p>

        <OutreachStudio
          prospectId={prospect.id}
          slug={prospect.slug}
          initial={{
            email_subject: outreach.email_subject,
            email_body: outreach.email_body,
            dm_body: outreach.dm_body,
            postcard_copy: outreach.postcard_copy,
            call_opener: outreach.call_opener,
          }}
          version={outreach.version_number}
        />
      </main>
    </>
  );
}
