import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { SCORE_SYSTEM } from "@/lib/openrouter/prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Note: not on edge runtime because we need the supabase server client
// (cookies-based) to update the row with RLS-disabled demo policies.

const schema = z.object({
  post_id: z.string().uuid().optional(),
  content: z.string().trim().min(1).max(2000),
});

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseScore(text: string): number | null {
  const match = text.match(/-?\d+/);
  if (!match) return null;
  const n = parseInt(match[0], 10);
  if (Number.isNaN(n)) return null;
  return clamp(n, 0, 100);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const text = await chat({
      messages: [
        { role: "system", content: SCORE_SYSTEM },
        { role: "user", content: parsed.data.content },
      ],
      temperature: 0.3,
      max_tokens: 8,
    });
    const score = parseScore(text);
    if (score == null) {
      return NextResponse.json({ error: "could not parse score", raw: text }, { status: 502 });
    }

    // Persist if a post_id was provided
    if (parsed.data.post_id) {
      const supabase = await createSupabaseServerClient();
      await supabase
        .from("posts")
        .update({ ai_score: score })
        .eq("id", parsed.data.post_id);
    }

    return NextResponse.json({ score });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
