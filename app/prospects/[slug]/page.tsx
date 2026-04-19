import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { TopNav } from "@/components/internal/top-nav";
import { ScoreHero } from "@/components/internal/score-hero";
import { CategoryTabs } from "@/components/internal/category-tabs";
import { RedFlagsCard } from "@/components/internal/red-flags-card";
import { ApprovalControls } from "@/components/internal/approval-controls";
import { GenerateActions } from "@/components/internal/generate-actions";

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
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <Link
              href="/prospects"
              className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500 hover:text-charcoal-900"
            >
              Prospects
            </Link>
            <h1 className="mt-2 font-serif text-4xl tracking-tight text-charcoal-900">{prospect.name}</h1>
            <p className="mt-1 text-sm text-charcoal-600">
              <a href={prospect.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-charcoal-900">
                {prospect.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
              {prospect.city ? ` · ${[prospect.city, prospect.state].filter(Boolean).join(", ")}` : null}
            </p>
          </div>
          <GenerateActions prospectId={prospect.id} slug={prospect.slug} hasMicrosite={!!microsite} hasOutreach={!!outreach} />
        </div>

        {!score ? (
          <div className="card-surface p-10 text-sm text-charcoal-600">
            Analysis has not completed yet. Try running intake again.
          </div>
        ) : (
          <>
            {/* Score hero */}
            <ScoreHero score={score} explain={explainScore(score)} />

            {/* Evidence + red flags */}
            <div className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
              <CategoryTabs score={score} />
              <div className="space-y-6">
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
