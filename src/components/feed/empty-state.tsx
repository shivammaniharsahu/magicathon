"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { randomLine, EMPTY_FEED_LINES } from "@/lib/constants/empty-states";
import { useUIStore } from "@/stores/ui-store";

export function EmptyFeed({ ctaLabel = "Be the first" }: { ctaLabel?: string }) {
  const [line, setLine] = React.useState(() => EMPTY_FEED_LINES[0]!);
  React.useEffect(() => setLine(randomLine(EMPTY_FEED_LINES)), []);
  const open = useUIStore((s) => s.openCreate);

  return (
    <Card className="p-10 text-center">
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="mx-auto text-6xl"
      >
        🦗
      </motion.div>
      <h3 className="mt-4 font-display text-xl font-semibold">{line}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        The feed is suspiciously quiet. Drop something cursed.
      </p>
      <Button className="mt-5" onClick={open}>
        <Sparkles className="h-4 w-4" /> {ctaLabel}
      </Button>
    </Card>
  );
}
