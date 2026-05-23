import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { CAPTION_SYSTEM } from "@/lib/openrouter/prompts";

export const runtime = "edge";

const schema = z.object({
  draft: z.string().trim().min(1).max(2000),
  vibe: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const vibeLine = parsed.data.vibe ? `Target vibe: ${parsed.data.vibe}.` : "";

  try {
    const text = await chat({
      messages: [
        { role: "system", content: CAPTION_SYSTEM },
        {
          role: "user",
          content: `Polish this draft. ${vibeLine}\n\nDraft:\n${parsed.data.draft}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 160,
    });
    return NextResponse.json({ caption: text });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
