import { NextResponse } from "next/server";
import { z } from "zod";
import { chat, type ChatMessage, OpenRouterError } from "@/lib/openrouter/client";
import { REWRITE_BLOCK_SYSTEM } from "@/lib/openrouter/prompts";

// Context-aware single-line generator. Used by the per-block "AI rewrite"
// button in the meme studio.
// - existing_lines: current state of every text block, in display order
// - target_index: which slot to fill
// - image (optional): if present, the AI looks at it for context (vision call)
// - prompt (optional): the user's image prompt, if any

export const runtime = "edge";

const schema = z.object({
  existing_lines: z.array(z.string()).max(8).default([]),
  target_index: z.number().int().min(0).max(7),
  image: z
    .string()
    .min(10)
    .refine(
      (v) => v.startsWith("data:image/") || v.startsWith("http://") || v.startsWith("https://"),
      "image must be a data URL or http(s) URL",
    )
    .optional(),
  prompt: z.string().trim().max(500).optional(),
});

function parseLine(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      if (typeof o.text === "string" && o.text.trim()) {
        return o.text.trim().slice(0, 140);
      }
    }
  } catch {
    // fallthrough — pluck the first non-empty line
  }
  const firstLine = cleaned.split(/\n+/).find((l) => l.trim());
  return firstLine ? firstLine.replace(/^["'`]|["'`]$/g, "").slice(0, 140) : null;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { existing_lines, target_index, image, prompt } = parsed.data;

  const lineDescriptions = existing_lines
    .map((line, i) => {
      const marker = i === target_index ? "← FILL THIS ONE" : "";
      return `Line ${i + 1}: "${line || "(empty)"}" ${marker}`.trim();
    })
    .join("\n");

  const promptLine = prompt ? `\nUser's image prompt: ${prompt}\n` : "";
  const userText = `${promptLine}Existing lines:\n${lineDescriptions}\n\nRewrite ONLY line ${target_index + 1}. Return the JSON now.`;

  const userMessage: ChatMessage = image
    ? {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: image, detail: "low" } },
        ],
      }
    : { role: "user", content: userText };

  try {
    const text = await chat({
      messages: [{ role: "system", content: REWRITE_BLOCK_SYSTEM }, userMessage],
      temperature: 0.92,
      max_tokens: 80,
    });
    const line = parseLine(text);
    if (!line) {
      return NextResponse.json({ error: "could not parse line", raw: text }, { status: 502 });
    }
    return NextResponse.json({ text: line });
  } catch (err) {
    const status = err instanceof OpenRouterError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
