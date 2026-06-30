import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readPublicEnv } from "../env";

let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const env = readPublicEnv();

  if (!env.hasSupabaseConfig) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  });

  return cachedClient;
}
