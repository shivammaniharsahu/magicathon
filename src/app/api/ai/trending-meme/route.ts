import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { TRENDING_MEME_SYSTEM } from "@/lib/openrouter/prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  // Optional seed vibe to steer the suggestion
  vibe: z.string().trim().max(40).optional(),
});

interface TrendingMeme {
  idea: string;
  image_prompt: string;
  top: string;
  bottom: string;
  vibe: string;
}

function sanitizeImagePrompt(raw: string): string {
  let p = raw;
  p = p.replace(/[,\s]*(?:top|bottom|caption|text|overlay)\s*[:=].*$/i, "");
  p = p.replace(/["“”'‘’].*?["“”'‘’]/g, "");
  p = p.replace(/\s+/g, " ").replace(/[\s,;:\-]+$/g, "").trim();
  if (!/no text/i.test(p)) p = `${p}, no text, no captions, no writing`;
  return p.slice(0, 280);
}

function parseTrendingResponse(text: string): TrendingMeme | null {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const idea = typeof o.idea === "string" ? o.idea : "";
      const image_prompt_raw = typeof o.image_prompt === "string" ? o.image_prompt : "";
      const top = typeof o.top === "string" ? o.top : "";
      const bottom = typeof o.bottom === "string" ? o.bottom : "";
      const vibe = typeof o.vibe === "string" ? o.vibe : "funny";
      if (idea && image_prompt_raw) {
        return { idea, image_prompt: sanitizeImagePrompt(image_prompt_raw), top, bottom, vibe };
      }
    }
  } catch {
    // fallthrough
  }
  return null;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = inputSchema.safeParse(json ?? {});
  const vibe = parsed.success ? parsed.data.vibe : undefined;

  // Pull the top recent + best-scoring posts. We use a composite signal:
  // laughs_count + (ai_score / 5) to prefer landed jokes, biased by recency.
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: topPosts, error } = await supabase
    .from("posts")
    .select("content, vibe, laughs_count, ai_score, meh_count, created_at")
    .gte("created_at", since)
    .order("laughs_count", { ascending: false })
    .limit(15);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lines = (topPosts ?? [])
    .slice(0, 12)
    .map((p, i) => {
      const score = (p.laughs_count ?? 0) + Math.round((p.ai_score ?? 0) / 5);
      return `${i + 1}. [${p.vibe ?? "—"} · ${score} pts] ${p.content.slice(0, 160)}`;
    })
    .join("\n");

  const userMsg = lines
    ? `Recent posts that are landing (vibe · ranking_score):\n${lines}\n\n${vibe ? `Lean into vibe: ${vibe}.\n` : ""}Return the JSON now.`
    : `No recent posts yet. Invent a fresh meme idea any vibe. Return the JSON now.`;

  try {
    const text = await chat({
      messages: [
        { role: "system", content: TRENDING_MEME_SYSTEM },
        { role: "user", content: userMsg },
      ],
      temperature: 0.95,
      max_tokens: 260,
    });
    const result = parseTrendingResponse(text);
    if (!result) {
      return NextResponse.json({ error: "could not parse JSON", raw: text }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
