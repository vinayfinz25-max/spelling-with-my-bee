import { describe, expect, it } from "vitest";

import { readPublicEnv } from "./env";

describe("readPublicEnv", () => {
  it("detects missing Supabase configuration", () => {
    expect(readPublicEnv({})).toEqual({
      hasSupabaseConfig: false,
      supabaseAnonKey: "",
      supabaseUrl: ""
    });
  });

  it("normalizes provided Supabase configuration", () => {
    expect(
      readPublicEnv({
        VITE_SUPABASE_ANON_KEY: " anon ",
        VITE_SUPABASE_URL: " https://example.supabase.co "
      })
    ).toEqual({
      hasSupabaseConfig: true,
      supabaseAnonKey: "anon",
      supabaseUrl: "https://example.supabase.co"
    });
  });

  it("accepts Vercel Supabase integration public variables", () => {
    expect(
      readPublicEnv({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: " anon ",
        NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co "
      })
    ).toEqual({
      hasSupabaseConfig: true,
      supabaseAnonKey: "anon",
      supabaseUrl: "https://example.supabase.co"
    });
  });
});
