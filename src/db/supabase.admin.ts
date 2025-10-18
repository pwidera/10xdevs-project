import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

// Admin client (Service Role) - SERVER ONLY
export function createSupabaseAdminClient() {
  const url = import.meta.env.SUPABASE_URL;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
