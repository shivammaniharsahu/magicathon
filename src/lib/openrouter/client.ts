const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Multimodal content part — used for vision-capable models like gpt-4o-mini.
// String content is the common case; the array form is for messages that mix
// text and images.
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
}

export class OpenRouterError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function chat({
  messages,
  model = "openai/gpt-4o-mini",
  temperature = 0.9,
  max_tokens = 320,
  signal,
}: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("Missing OPENROUTER_API_KEY", 500);

  const referer = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": referer,
      "X-Title": "MagicAthon",
    },
    body: JSON.stringify({ model, temperature, max_tokens, messages }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OpenRouterError(`OpenRouter ${res.status}: ${text.slice(0, 200)}`, res.status);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}
