// ============================================================================
// Supabase-backed store — same interface as file-based store.
// Uses service role key (server-only). Tables are prefixed `mare_` to isolate
// from the shared Aura project.
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type {
  ApprovalState,
  GenerationVersion,
  MicrositeRecord,
  OutreachAssets,
  ProspectRecord,
  ProspectScore,
  ProspectSource,
} from "@/lib/types";

function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Shape of microsite row in Supabase — payload collapsed into a single JSONB
// to keep the schema compact. We unpack into the MicrositeRecord shape the app uses.
interface MicrositePayload {
  hero_title: string;
  hero_subtitle: string;
  why_selected_json: MicrositeRecord["why_selected_json"];
  mare_system_json: MicrositeRecord["mare_system_json"];
  implementation_json: MicrositeRecord["implementation_json"];
  next_step_json: MicrositeRecord["next_step_json"];
  theme_json: MicrositeRecord["theme_json"];
  why_different_body: string;
}

function pack(m: MicrositeRecord): MicrositePayload {
  return {
    hero_title: m.hero_title,
    hero_subtitle: m.hero_subtitle,
    why_selected_json: m.why_selected_json,
    mare_system_json: m.mare_system_json,
    implementation_json: m.implementation_json,
    next_step_json: m.next_step_json,
    theme_json: m.theme_json,
    why_different_body: m.why_different_body,
  };
}

function unpack(row: {
  id: string;
  prospect_id: string;
  slug: string;
  payload_json: MicrositePayload;
  published: boolean;
  created_at: string;
  updated_at: string;
}): MicrositeRecord {
  return {
    id: row.id,
    prospect_id: row.prospect_id,
    slug: row.slug,
    ...row.payload_json,
    published: row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const supabaseStore = {
  // Prospects ----------------------------------------------------------------
  async listProspects(): Promise<ProspectRecord[]> {
    const { data, error } = await getClient()
      .from("mare_prospects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProspectRecord[];
  },

  async listProspectsWithScores(): Promise<Array<ProspectRecord & { score: ProspectScore | null }>> {
    const db = getClient();
    const [{ data: prospects, error: pErr }, { data: scores, error: sErr }] = await Promise.all([
      db.from("mare_prospects").select("*").order("created_at", { ascending: false }),
      db
        .from("mare_prospect_scores")
        .select("prospect_id, scoring_json, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (pErr) throw pErr;
    if (sErr) throw sErr;
    const latestByProspect = new Map<string, ProspectScore>();
    for (const s of (scores ?? []) as Array<{ prospect_id: string; scoring_json: ProspectScore }>) {
      if (!latestByProspect.has(s.prospect_id)) latestByProspect.set(s.prospect_id, s.scoring_json);
    }
    return ((prospects ?? []) as ProspectRecord[]).map((p) => ({
      ...p,
      score: latestByProspect.get(p.id) ?? null,
    }));
  },

  async getProspectBySlug(slug: string): Promise<ProspectRecord | undefined> {
    const { data, error } = await getClient().from("mare_prospects").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as ProspectRecord | undefined;
  },

  async getProspect(id: string): Promise<ProspectRecord | undefined> {
    const { data, error } = await getClient().from("mare_prospects").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as ProspectRecord | undefined;
  },

  async upsertProspect(input: Omit<ProspectRecord, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<ProspectRecord> {
    const db = getClient();
    // Find by id or slug (uniqueness guarantees one-or-none)
    const existing = input.id
      ? await db.from("mare_prospects").select("*").eq("id", input.id).maybeSingle()
      : await db.from("mare_prospects").select("*").eq("slug", input.slug).maybeSingle();

    if (existing.data) {
      const { data, error } = await db
        .from("mare_prospects")
        .update({
          name: input.name,
          website_url: input.website_url,
          instagram_url: input.instagram_url ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          notes: input.notes ?? null,
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.data.id)
        .select()
        .single();
      if (error) throw error;
      return data as ProspectRecord;
    }

    const { data, error } = await db
      .from("mare_prospects")
      .insert({
        id: input.id ?? randomUUID(),
        name: input.name,
        slug: input.slug,
        website_url: input.website_url,
        instagram_url: input.instagram_url ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        notes: input.notes ?? null,
        status: input.status,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ProspectRecord;
  },

  async updateProspectStatus(id: string, status: ProspectRecord["status"]): Promise<void> {
    const { error } = await getClient()
      .from("mare_prospects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  // Sources ------------------------------------------------------------------
  async saveSources(
    prospectId: string,
    sources: Array<Omit<ProspectSource, "id" | "prospect_id" | "created_at">>,
  ): Promise<ProspectSource[]> {
    if (!sources.length) return [];
    const { data, error } = await getClient()
      .from("mare_prospect_sources")
      .insert(sources.map((s) => ({ ...s, prospect_id: prospectId })))
      .select();
    if (error) throw error;
    return (data ?? []) as ProspectSource[];
  },

  async listSources(prospectId: string): Promise<ProspectSource[]> {
    const { data, error } = await getClient()
      .from("mare_prospect_sources")
      .select("*")
      .eq("prospect_id", prospectId);
    if (error) throw error;
    return (data ?? []) as ProspectSource[];
  },

  // Scores -------------------------------------------------------------------
  async saveScore(prospectId: string, score: ProspectScore): Promise<void> {
    const { error } = await getClient()
      .from("mare_prospect_scores")
      .insert({ prospect_id: prospectId, scoring_json: score });
    if (error) throw error;
  },

  async getLatestScore(prospectId: string): Promise<ProspectScore | undefined> {
    const { data, error } = await getClient()
      .from("mare_prospect_scores")
      .select("scoring_json")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data?.scoring_json as ProspectScore | undefined) ?? undefined;
  },

  // Microsite ----------------------------------------------------------------
  async saveMicrosite(m: MicrositeRecord): Promise<MicrositeRecord> {
    const db = getClient();
    const existing = await db
      .from("mare_microsites")
      .select("id")
      .eq("prospect_id", m.prospect_id)
      .maybeSingle();

    if (existing.data) {
      const { data, error } = await db
        .from("mare_microsites")
        .update({
          slug: m.slug,
          payload_json: pack(m),
          published: m.published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.data.id)
        .select()
        .single();
      if (error) throw error;
      return unpack(data);
    }

    const { data, error } = await db
      .from("mare_microsites")
      .insert({
        id: m.id,
        prospect_id: m.prospect_id,
        slug: m.slug,
        payload_json: pack(m),
        published: m.published,
      })
      .select()
      .single();
    if (error) throw error;
    return unpack(data);
  },

  async getMicrositeBySlug(slug: string): Promise<MicrositeRecord | undefined> {
    const { data, error } = await getClient()
      .from("mare_microsites")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? unpack(data) : undefined;
  },

  async getMicrositeByProspect(prospectId: string): Promise<MicrositeRecord | undefined> {
    const { data, error } = await getClient()
      .from("mare_microsites")
      .select("*")
      .eq("prospect_id", prospectId)
      .maybeSingle();
    if (error) throw error;
    return data ? unpack(data) : undefined;
  },

  async setMicrositePublished(prospectId: string, published: boolean): Promise<void> {
    const { error } = await getClient()
      .from("mare_microsites")
      .update({ published, updated_at: new Date().toISOString() })
      .eq("prospect_id", prospectId);
    if (error) throw error;
  },

  // Outreach -----------------------------------------------------------------
  async saveOutreach(
    prospectId: string,
    assets: Omit<OutreachAssets, "id" | "prospect_id" | "version_number" | "created_at">,
  ): Promise<OutreachAssets> {
    const db = getClient();
    const existing = await db
      .from("mare_outreach_assets")
      .select("version_number")
      .eq("prospect_id", prospectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (existing.data?.version_number ?? 0) + 1;

    const { data, error } = await db
      .from("mare_outreach_assets")
      .insert({
        prospect_id: prospectId,
        email_subject: assets.email_subject,
        email_body: assets.email_body,
        dm_body: assets.dm_body,
        postcard_copy: assets.postcard_copy,
        call_opener: assets.call_opener,
        version_number: nextVersion,
      })
      .select()
      .single();
    if (error) throw error;
    return data as OutreachAssets;
  },

  async getLatestOutreach(prospectId: string): Promise<OutreachAssets | undefined> {
    const { data, error } = await getClient()
      .from("mare_outreach_assets")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as OutreachAssets | undefined;
  },

  // Approvals ----------------------------------------------------------------
  async getApproval(prospectId: string): Promise<ApprovalState> {
    const { data, error } = await getClient()
      .from("mare_approval_states")
      .select("*")
      .eq("prospect_id", prospectId)
      .maybeSingle();
    if (error) throw error;
    return (
      (data as ApprovalState | null) ?? {
        prospect_id: prospectId,
        fit_score_approved: false,
        microsite_approved: false,
        outreach_approved: false,
      }
    );
  },

  async setApproval(next: ApprovalState): Promise<ApprovalState> {
    const { data, error } = await getClient()
      .from("mare_approval_states")
      .upsert(next, { onConflict: "prospect_id" })
      .select()
      .single();
    if (error) throw error;
    return data as ApprovalState;
  },

  // Versions -----------------------------------------------------------------
  async saveVersion(v: Omit<GenerationVersion, "id" | "created_at" | "version_number">): Promise<GenerationVersion> {
    const db = getClient();
    const existing = await db
      .from("mare_generation_versions")
      .select("version_number")
      .eq("prospect_id", v.prospect_id)
      .eq("object_type", v.object_type)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (existing.data?.version_number ?? 0) + 1;

    const { data, error } = await db
      .from("mare_generation_versions")
      .insert({
        prospect_id: v.prospect_id,
        object_type: v.object_type,
        version_number: nextVersion,
        payload_json: v.payload_json as Record<string, unknown>,
      })
      .select()
      .single();
    if (error) throw error;
    return data as GenerationVersion;
  },

  async listVersions(prospectId: string): Promise<GenerationVersion[]> {
    const { data, error } = await getClient()
      .from("mare_generation_versions")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as GenerationVersion[];
  },
};

export type SupabaseStore = typeof supabaseStore;
