import { NextResponse } from "next/server";
import { store } from "@/lib/db";

export const runtime = "nodejs";

// UUID v4-ish: we just guard Supabase from a query-param injection that would
// otherwise throw a typed error and bubble up as a 500.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prospect_id = url.searchParams.get("prospect_id");
  if (!prospect_id) return NextResponse.json({ error: "prospect_id required" }, { status: 400 });
  if (!UUID_RE.test(prospect_id)) {
    // Unknown / malformed id: treat as no versions rather than 500-ing
    return NextResponse.json({ versions: [] });
  }
  try {
    const versions = await store.listVersions(prospect_id);
    return NextResponse.json({ versions });
  } catch (err) {
    console.warn("[api/version] listVersions failed:", err);
    return NextResponse.json({ versions: [] });
  }
}
