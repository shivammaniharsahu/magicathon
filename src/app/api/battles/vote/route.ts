import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Registers a battle vote: bumps the winner's laughs_count by 1.
// We don't go through the reactions table because of the UNIQUE(post,user,type)
// constraint — battles let you "boost" the same post multiple times, which the
// reactions schema correctly forbids for normal likes. So we increment the
// counter column directly. RLS is permissive in demo mode so this is allowed.

// Relaxed UUID — accepts standard hex format including nil-style demo UUIDs
// like 00000000-0000-0000-0000-000000000001 (which fail strict RFC 4122).
const uuidish = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const schema = z.object({
  winner_id: uuidish,
  loser_id: uuidish.optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: current, error: readErr } = await supabase
    .from("posts")
    .select("laughs_count")
    .eq("id", parsed.data.winner_id)
    .maybeSingle();

  if (readErr || !current) {
    return NextResponse.json(
      { error: readErr?.message ?? "winner not found" },
      { status: 404 },
    );
  }

  const nextCount = (current.laughs_count ?? 0) + 1;
  const { error: updErr } = await supabase
    .from("posts")
    .update({ laughs_count: nextCount })
    .eq("id", parsed.data.winner_id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, laughs_count: nextCount });
}
