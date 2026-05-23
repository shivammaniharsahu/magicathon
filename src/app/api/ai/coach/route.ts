import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { COACH_SYSTEM } from "@/lib/openrouter/prompts";

// Live "funny coach" endpoint. Returns a score, a one-line tip, and a label.
// Called debounced from the create-post dialog as the user types.

export const runtime = "edge";

const schema = z.object({
  content: z.string().trim().min(1).max(2000),
  vibe: z.string().trim().max(40).optional(),
});

interface CoachResult {
  score: number;
  tip: string;
  label: string;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseCoach(raw: string): CoachResult | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const score = typeof o.score === "number" ? clamp(Math.round(o.score), 0, 100) : null;
      const tip = typeof o.tip === "string" ? o.tip.slice(0, 140) : null;
      const label = typeof o.label === "string" ? o.label : "raw";
      if (score != null && tip) return { score, tip, label };
    }
  } catch {
    // fallthrough
  }
  return null;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const vibeLine = parsed.data.vibe ? `Target vibe: ${parsed.data.vibe}.` : "";
  const userMsg = `Draft:\n${parsed.data.content}\n\n${vibeLine}\nReturn the JSON now.`;

  try {
    const text = await chat({
      messages: [
        { role: "system", content: COACH_SYSTEM },
        { role: "user", content: userMsg },
      ],
      temperature: 0.55,
      max_tokens: 90,
    });
    const result = parseCoach(text);
    if (!result) {
      return NextResponse.json({ error: "could not parse coach JSON", raw: text }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
