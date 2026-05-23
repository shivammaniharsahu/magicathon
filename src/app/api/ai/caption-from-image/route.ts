import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, OpenRouterError } from "@/lib/openrouter/client";
import { VISION_CAPTION_SYSTEM } from "@/lib/openrouter/prompts";

// Vision captioner. Accepts either a base64 data URL (for local uploads/selfies)
// or a public https URL (for hosted images). Returns top + bottom + description.

export const runtime = "edge";

const schema = z.object({
  // Either a data: URL or https:// URL — the vision model will fetch the latter.
  image: z
    .string()
    .min(10)
    .refine(
      (v) => v.startsWith("data:image/") || v.startsWith("https://") || v.startsWith("http://"),
      "image must be a data URL or http(s) URL",
    ),
  // Optional vibe hint to steer the caption (e.g., "rant", "wholesome").
  hint: z.string().trim().max(60).optional(),
});

interface VisionResult {
  top: string;
  bottom: string;
  description: string;
}

function parseVisionResponse(raw: string): VisionResult | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      const top = typeof o.top === "string" ? o.top.slice(0, 100) : "";
      const bottom = typeof o.bottom === "string" ? o.bottom.slice(0, 100) : "";
      const description =
        typeof o.description === "string" ? o.description.slice(0, 240) : "";
      if (top || bottom) return { top, bottom, description };
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

  const hintLine = parsed.data.hint
    ? `Tone hint: ${parsed.data.hint}. `
    : "";

  try {
    const text = await chat({
      messages: [
        { role: "system", content: VISION_CAPTION_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${hintLine}Look at this image and return the meme-caption JSON now.`,
            },
            {
              type: "image_url",
              image_url: { url: parsed.data.image, detail: "low" },
            },
          ],
        },
      ],
      temperature: 0.85,
      max_tokens: 200,
    });
    const result = parseVisionResponse(text);
    if (!result) {
      return NextResponse.json(
        { error: "could not parse vision JSON", raw: text },
        { status: 502 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
