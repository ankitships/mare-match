// ============================================================================
// Storage abstraction
// ----------------------------------------------------------------------------
// If Supabase env vars are present, use Supabase. Otherwise, fall back to a
// file-based JSON store under data/storage/ so the hackathon prototype runs
// out of the box with zero infra. Both paths expose the same async interface.
// ============================================================================

import fs from "node:fs/promises";
import path from "node:path";
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

// --- File-backed store ------------------------------------------------------
// On Vercel the app bundle is read-only, but /tmp is writable and persists
// across warm invocations on the same Lambda instance.
const STORAGE_ROOT = process.env.VERCEL
  ? "/tmp/mare-match-storage"
  : path.join(process.cwd(), "data", "storage");
const FILES = {
  prospects: path.join(STORAGE_ROOT, "prospects.json"),
  sources: path.join(STORAGE_ROOT, "sources.json"),
  scores: path.join(STORAGE_ROOT, "scores.json"),
  microsites: path.join(STORAGE_ROOT, "microsites.json"),
  outreach: path.join(STORAGE_ROOT, "outreach.json"),
  approvals: path.join(STORAGE_ROOT, "approvals.json"),
  versions: path.join(STORAGE_ROOT, "versions.json"),
};

async function ensureDir() {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

async function readJson<T>(file: string): Promise<T[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw err;
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

// --- Public API -------------------------------------------------------------

export const store = {
  // Prospects ----------------------------------------------------------------
  async listProspects(): Promise<ProspectRecord[]> {
    const rows = await readJson<ProspectRecord>(FILES.prospects);
    return rows.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
  },

  async getProspectBySlug(slug: string): Promise<ProspectRecord | undefined> {
    const rows = await readJson<ProspectRecord>(FILES.prospects);
    return rows.find((r) => r.slug === slug);
  },

  async getProspect(id: string): Promise<ProspectRecord | undefined> {
    const rows = await readJson<ProspectRecord>(FILES.prospects);
    return rows.find((r) => r.id === id);
  },

  async upsertProspect(input: Omit<ProspectRecord, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<ProspectRecord> {
    const rows = await readJson<ProspectRecord>(FILES.prospects);
    const now = new Date().toISOString();
    const existing = input.id
      ? rows.find((r) => r.id === input.id)
      : rows.find((r) => r.slug === input.slug);
    if (existing) {
      Object.assign(existing, input, { updated_at: now });
      await writeJson(FILES.prospects, rows);
      return existing;
    }
    const rec: ProspectRecord = {
      ...input,
      id: input.id ?? randomUUID(),
      created_at: now,
      updated_at: now,
    };
    rows.push(rec);
    await writeJson(FILES.prospects, rows);
    return rec;
  },

  async updateProspectStatus(id: string, status: ProspectRecord["status"]) {
    const rows = await readJson<ProspectRecord>(FILES.prospects);
    const r = rows.find((x) => x.id === id);
    if (r) {
      r.status = status;
      r.updated_at = new Date().toISOString();
      await writeJson(FILES.prospects, rows);
    }
  },

  // Sources ------------------------------------------------------------------
  async saveSources(prospectId: string, sources: Array<Omit<ProspectSource, "id" | "prospect_id" | "created_at">>) {
    const rows = await readJson<ProspectSource>(FILES.sources);
    const out: ProspectSource[] = sources.map((s) => ({
      ...s,
      id: randomUUID(),
      prospect_id: prospectId,
      created_at: new Date().toISOString(),
    }));
    await writeJson(FILES.sources, [...rows, ...out]);
    return out;
  },

  async listSources(prospectId: string): Promise<ProspectSource[]> {
    const rows = await readJson<ProspectSource>(FILES.sources);
    return rows.filter((r) => r.prospect_id === prospectId);
  },

  // Scores -------------------------------------------------------------------
  async saveScore(prospectId: string, score: ProspectScore): Promise<void> {
    const rows = await readJson<{ prospect_id: string; score: ProspectScore; created_at: string }>(FILES.scores);
    // Keep latest on top
    rows.unshift({ prospect_id: prospectId, score, created_at: new Date().toISOString() });
    await writeJson(FILES.scores, rows);
  },

  async getLatestScore(prospectId: string): Promise<ProspectScore | undefined> {
    const rows = await readJson<{ prospect_id: string; score: ProspectScore }>(FILES.scores);
    return rows.find((r) => r.prospect_id === prospectId)?.score;
  },

  // Microsite ----------------------------------------------------------------
  async saveMicrosite(m: MicrositeRecord): Promise<MicrositeRecord> {
    const rows = await readJson<MicrositeRecord>(FILES.microsites);
    const idx = rows.findIndex((r) => r.prospect_id === m.prospect_id);
    if (idx >= 0) rows[idx] = m;
    else rows.push(m);
    await writeJson(FILES.microsites, rows);
    return m;
  },

  async getMicrositeBySlug(slug: string): Promise<MicrositeRecord | undefined> {
    const rows = await readJson<MicrositeRecord>(FILES.microsites);
    return rows.find((r) => r.slug === slug);
  },

  async getMicrositeByProspect(prospectId: string): Promise<MicrositeRecord | undefined> {
    const rows = await readJson<MicrositeRecord>(FILES.microsites);
    return rows.find((r) => r.prospect_id === prospectId);
  },

  async setMicrositePublished(prospectId: string, published: boolean) {
    const rows = await readJson<MicrositeRecord>(FILES.microsites);
    const r = rows.find((x) => x.prospect_id === prospectId);
    if (r) {
      r.published = published;
      r.updated_at = new Date().toISOString();
      await writeJson(FILES.microsites, rows);
    }
  },

  // Outreach -----------------------------------------------------------------
  async saveOutreach(prospectId: string, assets: Omit<OutreachAssets, "id" | "prospect_id" | "version_number" | "created_at">): Promise<OutreachAssets> {
    const rows = await readJson<OutreachAssets>(FILES.outreach);
    const existing = rows.filter((r) => r.prospect_id === prospectId);
    const version_number = existing.length + 1;
    const rec: OutreachAssets = {
      ...assets,
      id: randomUUID(),
      prospect_id: prospectId,
      version_number,
      created_at: new Date().toISOString(),
    };
    rows.push(rec);
    await writeJson(FILES.outreach, rows);
    return rec;
  },

  async getLatestOutreach(prospectId: string): Promise<OutreachAssets | undefined> {
    const rows = await readJson<OutreachAssets>(FILES.outreach);
    return rows
      .filter((r) => r.prospect_id === prospectId)
      .sort((a, b) => b.version_number - a.version_number)[0];
  },

  // Approvals ----------------------------------------------------------------
  async getApproval(prospectId: string): Promise<ApprovalState> {
    const rows = await readJson<ApprovalState>(FILES.approvals);
    return (
      rows.find((r) => r.prospect_id === prospectId) ?? {
        prospect_id: prospectId,
        fit_score_approved: false,
        microsite_approved: false,
        outreach_approved: false,
      }
    );
  },

  async setApproval(next: ApprovalState): Promise<ApprovalState> {
    const rows = await readJson<ApprovalState>(FILES.approvals);
    const idx = rows.findIndex((r) => r.prospect_id === next.prospect_id);
    if (idx >= 0) rows[idx] = next;
    else rows.push(next);
    await writeJson(FILES.approvals, rows);
    return next;
  },

  // Versions -----------------------------------------------------------------
  async saveVersion(v: Omit<GenerationVersion, "id" | "created_at" | "version_number">): Promise<GenerationVersion> {
    const rows = await readJson<GenerationVersion>(FILES.versions);
    const existing = rows.filter((r) => r.prospect_id === v.prospect_id && r.object_type === v.object_type);
    const version_number = existing.length + 1;
    const rec: GenerationVersion = {
      ...v,
      id: randomUUID(),
      version_number,
      created_at: new Date().toISOString(),
    };
    rows.push(rec);
    await writeJson(FILES.versions, rows);
    return rec;
  },

  async listVersions(prospectId: string): Promise<GenerationVersion[]> {
    const rows = await readJson<GenerationVersion>(FILES.versions);
    return rows
      .filter((r) => r.prospect_id === prospectId)
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
  },
};

export type Store = typeof store;
