"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedList } from "./feed-list";

const TABS = [
  { key: "for-you", label: "For You" },
  { key: "roast-me", label: "🔥 Roast Me" },
  { key: "following", label: "Following" },
  { key: "new", label: "New" },
] as const;

export function FeedTabs() {
  return (
    <Tabs defaultValue="for-you">
      <TabsList className="w-full justify-start overflow-x-auto">
        {TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key} className="shrink-0">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.key} value={t.key}>
          <FeedList tab={t.key} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
