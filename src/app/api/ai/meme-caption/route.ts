import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { MEME_CAPTION_SYSTEM } from "@/lib/openrouter/prompts";

export const runtime = "edge";

const schema = z.object({
  idea: z.string().trim().min(1).max(280),
  hint: z.string().trim().max(120).optional(),
});

interface CaptionJSON {
  top?: string;
  bottom?: string;
}

function parseCaption(text: string): CaptionJSON {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const top = typeof o.top === "string" ? o.top.slice(0, 80) : "";
      const bottom = typeof o.bottom === "string" ? o.bottom.slice(0, 80) : "";
      return { top, bottom };
    }
  } catch {
    // fallthrough to line split
  }
  // Fallback: take first two non-empty lines
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.replace(/^[-*\d.\s"]+/, "").replace(/[",]+$/, "").trim())
    .filter(Boolean);
  return { top: lines[0] ?? "", bottom: lines[1] ?? "" };
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const hintLine = parsed.data.hint ? `Tone hint: ${parsed.data.hint}.` : "";
  const userMsg = `Idea: ${parsed.data.idea}\n${hintLine}\nReturn the JSON now.`;

  try {
    const text = await chat({
      messages: [
        { role: "system", content: MEME_CAPTION_SYSTEM },
        { role: "user", content: userMsg },
      ],
      temperature: 0.95,
      max_tokens: 120,
    });
    return NextResponse.json(parseCaption(text));
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
