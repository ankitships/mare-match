import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { TopNav } from "@/components/internal/top-nav";
import { ScoreHero } from "@/components/internal/score-hero";
import { CategoryTabs } from "@/components/internal/category-tabs";
import { RedFlagsCard } from "@/components/internal/red-flags-card";
import { ApprovalControls } from "@/components/internal/approval-controls";
import { GenerateActions } from "@/components/internal/generate-actions";
import { DeleteProspectButton } from "@/components/internal/delete-prospect-button";

import { store } from "@/lib/db";
import { explainScore } from "@/lib/scoring/engine";

export const dynamic = "force-dynamic";

export default async function ProspectReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prospect = await store.getProspectBySlug(slug);
  if (!prospect) return notFound();

  const [score, microsite, outreach, approval] = await Promise.all([
    store.getLatestScore(prospect.id),
    store.getMicrositeByProspect(prospect.id),
    store.getLatestOutreach(prospect.id),
    store.getApproval(prospect.id),
  ]);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        {/* Breadcrumb */}
        <Link
          href="/prospects"
          className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-mare-dark/55 hover:text-mare-extra-dark"
        >
          ← Prospects
        </Link>

        {/* Identity block */}
        <section className="mt-5 grid gap-6 md:grid-cols-[1fr,auto] md:items-end">
          <div className="min-w-0">
            <h1 className="font-serif text-[44px] font-medium leading-[1.1] tracking-tight text-mare-extra-dark">
              {prospect.name}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mare-dark/75">
              <a
                href={prospect.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-mare-key hover:text-mare-brown"
              >
                {prospect.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight className="h-3 w-3" />
              </a>
              {[prospect.city, prospect.state].filter(Boolean).length > 0 && (
                <>
                  <span className="text-mare-dark/30">·</span>
                  <span>{[prospect.city, prospect.state].filter(Boolean).join(", ")}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <GenerateActions
              prospectId={prospect.id}
              slug={prospect.slug}
              hasMicrosite={!!microsite}
              hasOutreach={!!outreach}
            />
            <DeleteProspectButton prospectId={prospect.id} prospectName={prospect.name} />
          </div>
        </section>

        <div className="hairline mt-10" />

        {!score ? (
          <div className="card-surface mt-12 p-12 text-sm text-mare-dark/75">
            Analysis hasn't completed yet. Try running intake again.
          </div>
        ) : (
          <>
            <div className="mt-12">
              <ScoreHero score={score} explain={explainScore(score)} />
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-[2fr,1fr]">
              <CategoryTabs score={score} />
              <div className="space-y-8">
                <RedFlagsCard score={score} />
                <ApprovalControls
                  prospectId={prospect.id}
                  initial={approval}
                  hasMicrosite={!!microsite}
                  hasOutreach={!!outreach}
                  micrositePublished={microsite?.published ?? false}
                  prospectSlug={prospect.slug}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
