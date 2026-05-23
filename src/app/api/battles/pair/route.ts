import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post } from "@/types/db";

// Returns two random recent posts for a head-to-head battle.
// Caller passes `exclude` (comma-separated post IDs) to avoid repeats.
// We over-fetch the 50 most recent posts and pick two at random in JS so the
// shuffle is deterministic per-request without needing Postgres random().

export async function GET(req: Request) {
  const url = new URL(req.url);
  const excludeRaw = url.searchParams.get("exclude") ?? "";
  const exclude = new Set(excludeRaw.split(",").filter(Boolean));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, user_id, content, media_urls, type, vibe, audience, is_roast_me, magic_boost, poll_options, laughs_count, comments_count, shares_count, meh_count, ai_score, created_at, profile:profiles!posts_user_id_fkey(*)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ pair: null, error: error.message }, { status: 500 });
  }

  const candidates = ((data as unknown as Post[]) ?? []).filter((p) => !exclude.has(p.id));
  if (candidates.length < 2) {
    return NextResponse.json({ pair: null });
  }

  // Prefer pairs that include at least one image post when possible.
  const withImages = candidates.filter((p) => p.media_urls && p.media_urls.length > 0);
  const pool = withImages.length >= 2 ? withImages : candidates;

  // Fisher-Yates partial shuffle for a clean pair.
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  return NextResponse.json({ pair: [shuffled[0], shuffled[1]] });
}
