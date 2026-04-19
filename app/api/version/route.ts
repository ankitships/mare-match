import { NextResponse } from "next/server";
import { store } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prospect_id = url.searchParams.get("prospect_id");
  if (!prospect_id) return NextResponse.json({ error: "prospect_id required" }, { status: 400 });
  const versions = await store.listVersions(prospect_id);
  return NextResponse.json({ versions });
}
