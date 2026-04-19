// ============================================================================
// Store router — Supabase when SUPABASE_SERVICE_ROLE_KEY is present, else the
// file-based fallback. Both conform to the same interface.
// ============================================================================

import { store as fileStore } from "./store";
import { supabaseStore } from "./supabase-store";

const hasSupabase =
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  (!!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL);

export const store = hasSupabase ? supabaseStore : fileStore;
