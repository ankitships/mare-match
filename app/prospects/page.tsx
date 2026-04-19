import Link from "next/link";
import { TopNav } from "@/components/internal/top-nav";
import { ProspectsList } from "@/components/internal/prospects-list";
import { store } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProspectIndexPage() {
  const rows = await store.listProspectsWithScores();

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-8">
          <h1 className="font-serif text-4xl tracking-tight text-charcoal-900">All prospects</h1>
          <p className="mt-2 text-sm text-charcoal-600">
            {rows.length} total · filter by fit or sort by score
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="card-surface p-10 text-sm text-charcoal-600">
            No prospects yet. Return to{" "}
            <Link href="/" className="underline">
              Intake
            </Link>
            .
          </div>
        ) : (
          <ProspectsList rows={rows} />
        )}
      </main>
    </>
  );
}
