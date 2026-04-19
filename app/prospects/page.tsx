import Link from "next/link";
import { TopNav } from "@/components/internal/top-nav";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProspectIndexPage() {
  const rows = await store.listProspects();

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="font-serif text-4xl tracking-tight text-charcoal-900">All prospects</h1>
        <p className="mt-2 text-sm text-charcoal-600">{rows.length} total</p>

        <div className="mt-8 card-surface">
          {rows.length === 0 ? (
            <div className="p-10 text-sm text-charcoal-600">
              No prospects yet. Return to <Link href="/" className="underline">Intake</Link>.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/prospects/${p.slug}`}
                    className="flex items-center justify-between gap-4 px-6 py-5 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-serif text-xl tracking-tight text-charcoal-900">{p.name}</div>
                      <div className="text-xs text-charcoal-500 mt-1">{p.website_url}</div>
                    </div>
                    <Badge variant="muted">{p.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
