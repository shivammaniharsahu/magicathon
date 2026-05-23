import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { ROAST_SYSTEM } from "@/lib/openrouter/prompts";

export const runtime = "edge";

const schema = z.object({
  post: z.string().trim().min(1).max(1500),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const text = await chat({
      messages: [
        { role: "system", content: ROAST_SYSTEM },
        { role: "user", content: `Roast this post:\n\n${parsed.data.post}` },
      ],
      temperature: 0.95,
      max_tokens: 100,
    });
    return NextResponse.json({ roast: text });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
