import Link from "next/link";
import { TopNav } from "@/components/internal/top-nav";

export default function NotFound() {
  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">Not found</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">This prospect doesn't exist.</h1>
        <p className="mt-3 text-sm text-charcoal-600">
          Return to <Link href="/" className="underline">intake</Link> and analyze a new URL.
        </p>
      </main>
    </>
  );
}
