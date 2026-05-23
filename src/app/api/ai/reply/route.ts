import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { REPLY_SYSTEM, ROAST_SYSTEM } from "@/lib/openrouter/prompts";

export const runtime = "edge";

const schema = z.object({
  post: z.string().trim().min(1).max(1500),
  kind: z.enum(["funny", "roast"]).default("funny"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const system = parsed.data.kind === "roast" ? `${ROAST_SYSTEM}\n\nReturn three roasts as a JSON array of strings, like ["a","b","c"]. No preamble.` : REPLY_SYSTEM;

  try {
    const text = await chat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Post:\n\n${parsed.data.post}` },
      ],
      temperature: 0.95,
      max_tokens: 220,
    });

    const replies = safeParseReplies(text);
    return NextResponse.json({ replies });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

function safeParseReplies(text: string): string[] {
  // Try JSON first
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((s) => typeof s === "string").slice(0, 3);
    }
  } catch {
    // fallthrough
  }
  // Fallback: split lines
  return trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}
