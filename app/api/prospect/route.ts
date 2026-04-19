import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db";

export const runtime = "nodejs";

const DeleteBody = z.object({ prospect_id: z.string().uuid() });

export async function DELETE(req: Request) {
  const parsed = DeleteBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  try {
    await store.deleteProspect(parsed.data.prospect_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/prospect] delete failed:", err);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
