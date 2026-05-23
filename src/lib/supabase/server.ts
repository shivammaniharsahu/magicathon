import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEMO_PROFILE_ID, DEMO_USERNAME } from "@/lib/demo";
import type { Profile } from "@/types/db";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component; setting cookies here is a no-op
            // and the session is refreshed via middleware instead.
          }
        },
      },
    },
  );
}

export async function getServerUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

const FALLBACK_DEMO_PROFILE: Profile = {
  id: DEMO_PROFILE_ID,
  username: DEMO_USERNAME,
  display_name: "Magic Guest",
  avatar_url: null,
  bio: "demo mode is on. we all laugh as one. ✨",
  laugh_score: 0,
  followers_count: 0,
  following_count: 0,
  created_at: new Date(0).toISOString(),
};

export async function getServerProfile() {
  // Demo mode: always return the shared "Magic Guest" profile.
  // If the DB row hasn't been seeded yet, return an in-memory fallback so
  // the UI still renders. Posting will fail until demo-mode.sql is applied.
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", DEMO_PROFILE_ID)
    .maybeSingle();
  return data ?? FALLBACK_DEMO_PROFILE;
}

// Returns true when the demo profile row actually exists in the DB.
export async function isDemoReady(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", DEMO_PROFILE_ID)
    .maybeSingle();
  return !!data;
}
