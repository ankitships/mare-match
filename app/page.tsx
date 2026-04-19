import Link from "next/link";
import { TopNav } from "@/components/internal/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntakeForm } from "@/components/internal/intake-form";
import { store } from "@/lib/db";
import { ensureSeeded } from "@/lib/db/auto-seed";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  new: "Queued",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  approved: "Approved",
  sent: "Sent",
};

export default async function IntakePage() {
  await ensureSeeded();
  const recent = await store.listProspects();

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-6xl px-6 py-14">
        {/* Masthead */}
        <section className="mb-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-charcoal-500">
            Partner Qualification · Internal
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-charcoal-900 text-balance">
            A composed, evidence-backed way to evaluate MaRe partnerships.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal-600">
            Paste a salon or spa URL. MaRe Match reads the site, scores the luxury fit against a nine-category rubric,
            and drafts a private, shareable partner microsite for human review.
          </p>
        </section>

        <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr]">
          {/* Intake */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle>Analyze a prospect</CardTitle>
              <CardDescription>
                We crawl the site, extract evidence across nine categories, and compute a weighted score in code — not in
                the model.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntakeForm />
            </CardContent>
          </Card>

          {/* Recent prospects */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-serif text-2xl tracking-tight text-charcoal-900">Recent prospects</h2>
              {recent.length > 0 && (
                <span className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
                  {recent.length} total
                </span>
              )}
            </div>
            <div className="card-surface">
              {recent.length === 0 ? (
                <div className="p-8 text-sm leading-relaxed text-charcoal-600">
                  No prospects yet. Try one of the prepared demo salons:
                  <ul className="mt-4 space-y-2 text-charcoal-700">
                    <li>· https://desangesalon.example — strong fit</li>
                    <li>· https://rosanoferretti-nyc.example — ambiguous</li>
                    <li>· https://cutzone-express.example — not a fit</li>
                  </ul>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/prospects/${p.slug}`}
                        className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="font-serif text-lg tracking-tight text-charcoal-900 truncate">
                            {p.name}
                          </div>
                          <div className="mt-0.5 text-xs text-charcoal-500">
                            {[p.city, p.state].filter(Boolean).join(", ") || "—"} · {p.website_url.replace(/^https?:\/\//, "")}
                          </div>
                        </div>
                        <Badge
                          variant={p.status === "approved" ? "accent" : p.status === "analyzing" ? "warn" : "muted"}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
