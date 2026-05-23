// Server-side daily-trending generator. Module-level cache keyed by UTC date
// so the same meme persists for the whole day across requests within the same
// Next.js worker process. For production-scale durability you'd swap this for
// Supabase or Redis — fine for the demo.

import { chat } from "@/lib/openrouter/client";
import { TRENDING_MEME_SYSTEM } from "@/lib/openrouter/prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface DailyMeme {
  date: string; // YYYY-MM-DD (UTC)
  idea: string;
  image_prompt: string;
  top: string;
  bottom: string;
  vibe: string;
  image_url: string;
  generated_at: string;
}

const cache = new Map<string, DailyMeme>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic non-negative integer derived from a date string.
// Same date → same seed → same Pollinations image all day.
function seedFromDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h << 5) - h + date.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 1_000_000;
}

// Strip any leaked rendering directives from an image_prompt.
// The model sometimes embeds "top: 'foo'", quoted captions, or "caption: ...".
// We aggressively chop everything after the first such marker.
function sanitizeImagePrompt(raw: string): string {
  let p = raw;
  // Remove the JSON-leakage tails like ", top: '...'", ", bottom: \"...\"", ", caption: ..."
  p = p.replace(/[,\s]*(?:top|bottom|caption|text|overlay)\s*[:=].*$/i, "");
  // Remove any explicit quoted text fragment
  p = p.replace(/["“”'‘’].*?["“”'‘’]/g, "");
  // Collapse stray whitespace + trailing punctuation
  p = p.replace(/\s+/g, " ").replace(/[\s,;:\-]+$/g, "").trim();
  // Always append no-text hint to suppress Flux's text-rendering tendency.
  if (!/no text/i.test(p)) p = `${p}, no text, no captions, no writing`;
  return p.slice(0, 280);
}

function parseJSON(text: string): Partial<DailyMeme> | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      return {
        idea: typeof o.idea === "string" ? o.idea : "",
        image_prompt: typeof o.image_prompt === "string" ? sanitizeImagePrompt(o.image_prompt) : "",
        top: typeof o.top === "string" ? o.top : "",
        bottom: typeof o.bottom === "string" ? o.bottom : "",
        vibe: typeof o.vibe === "string" ? o.vibe : "funny",
      };
    }
  } catch {
    // fallthrough
  }
  return null;
}

export async function getDailyTrendingMeme(opts: { force?: boolean } = {}): Promise<DailyMeme | null> {
  const date = todayKey();
  if (!opts.force && cache.has(date)) return cache.get(date) ?? null;

  try {
    const supabase = await createSupabaseServerClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: topPosts } = await supabase
      .from("posts")
      .select("content, vibe, laughs_count, ai_score, meh_count, created_at")
      .gte("created_at", since)
      .order("laughs_count", { ascending: false })
      .limit(12);

    const lines = (topPosts ?? [])
      .map((p, i) => {
        const score = (p.laughs_count ?? 0) + Math.round((p.ai_score ?? 0) / 5);
        return `${i + 1}. [${p.vibe ?? "—"} · ${score}pts] ${String(p.content).slice(0, 160)}`;
      })
      .join("\n");

    const userMsg = lines
      ? `Recent posts that landed (vibe · ranking_score):\n${lines}\n\nReturn the JSON now.`
      : `No recent posts yet. Invent a fresh meme idea any vibe. Return the JSON now.`;

    const text = await chat({
      messages: [
        { role: "system", content: TRENDING_MEME_SYSTEM },
        { role: "user", content: userMsg },
      ],
      temperature: 0.95,
      max_tokens: 280,
    });

    const parsed = parseJSON(text);
    if (!parsed || !parsed.idea || !parsed.image_prompt) {
      // eslint-disable-next-line no-console
      console.warn("[daily-trending] parse failed:", text.slice(0, 200));
      return null;
    }

    const seed = seedFromDate(date);
    const params = new URLSearchParams({
      prompt: parsed.image_prompt,
      seed: String(seed),
    });
    const image_url = `/api/ai/image-proxy?${params.toString()}`;

    const meme: DailyMeme = {
      date,
      idea: parsed.idea,
      image_prompt: parsed.image_prompt,
      top: parsed.top ?? "",
      bottom: parsed.bottom ?? "",
      vibe: parsed.vibe ?? "funny",
      image_url,
      generated_at: new Date().toISOString(),
    };
    cache.set(date, meme);
    return meme;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[daily-trending] generation failed:", err);
    return null;
  }
}
