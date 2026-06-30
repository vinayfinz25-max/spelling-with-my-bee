interface PublicEnvSource {
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
}

export interface PublicEnv {
  readonly hasSupabaseConfig: boolean;
  readonly supabaseAnonKey: string;
  readonly supabaseUrl: string;
}

export function readPublicEnv(
  env: PublicEnvSource = import.meta.env
): PublicEnv {
  const supabaseUrl = cleanEnvValue(env.VITE_SUPABASE_URL);
  const supabaseAnonKey = cleanEnvValue(env.VITE_SUPABASE_ANON_KEY);

  return {
    hasSupabaseConfig: supabaseUrl.length > 0 && supabaseAnonKey.length > 0,
    supabaseAnonKey,
    supabaseUrl
  };
}

function cleanEnvValue(value: string | undefined): string {
  return value?.trim() ?? "";
}
