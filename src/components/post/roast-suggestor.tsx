"use client";

import * as React from "react";
import { Flame, Loader2, RefreshCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RoastSuggestor({ postContent }: { postContent: string }) {
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [reply, setReply] = React.useState("");

  const generate = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post: postContent, kind: "roast" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { replies: string[] };
      setSuggestions(data.replies);
    } catch {
      toast.error("AI is on a coffee break. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    toast.success("Roast sent (demo).");
    setReply("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="glass"
          size="xs"
          onClick={generate}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flame className="h-3 w-3" />}
          AI roast me
        </Button>
        {suggestions.length > 0 && (
          <Button type="button" variant="ghost" size="xs" onClick={generate} disabled={loading}>
            <RefreshCcw className="h-3 w-3" /> regenerate
          </Button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setReply(s)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-left transition hover:border-brand/40 hover:bg-brand/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Add a roast…"
          className="h-10"
          onKeyDown={(e) => {
            if (e.key === "Enter") sendReply();
          }}
        />
        <Button type="button" size="icon" onClick={sendReply} aria-label="Send roast">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
