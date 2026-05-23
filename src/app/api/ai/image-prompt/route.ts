import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { IMAGE_PROMPT_SYSTEM } from "@/lib/openrouter/prompts";

// Rewrites a rough idea into a juicy image-generation prompt that Flux/Pollinations
// will render well. Doesn't generate the image — just the prompt.

export const runtime = "edge";

const schema = z.object({
  idea: z.string().trim().min(1).max(280),
  style: z.string().trim().max(60).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const styleLine = parsed.data.style ? `Preferred style: ${parsed.data.style}.` : "";

  try {
    const text = await chat({
      messages: [
        { role: "system", content: IMAGE_PROMPT_SYSTEM },
        { role: "user", content: `Idea: ${parsed.data.idea}\n${styleLine}` },
      ],
      temperature: 0.9,
      max_tokens: 140,
    });
    const cleaned = text.trim().replace(/^["']|["']$/g, "").slice(0, 240);
    return NextResponse.json({ prompt: cleaned });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
