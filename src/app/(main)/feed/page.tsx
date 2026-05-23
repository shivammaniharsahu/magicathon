import { FeedTabs } from "@/components/feed/feed-tabs";
import { DailyChallenge } from "@/components/feed/daily-challenge";
import { TrendingRail } from "@/components/feed/trending-rail";
import { WhoToFollow } from "@/components/feed/who-to-follow";
import { DailyTrendingCard } from "@/components/feed/daily-trending-card";
import { MemeBattle } from "@/components/feed/meme-battle";
import { DemoNotReadyBanner } from "@/components/layout/demo-banner";
import { isDemoReady } from "@/lib/supabase/server";
import { getDailyTrendingMeme } from "@/lib/trending/daily-meme";

export default async function FeedPage() {
  const [ready, trending] = await Promise.all([
    isDemoReady(),
    getDailyTrendingMeme(),
  ]);

  return (
    <>
      {!ready ? <DemoNotReadyBanner /> : null}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Your feed <span className="gradient-text">😂</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Real people. Real laughs. Zero corporate energy.
          </p>

          {trending ? (
            <div className="mt-6">
              <DailyTrendingCard meme={trending} />
            </div>
          ) : null}

          <div className="mt-6">
            <MemeBattle />
          </div>

          <div className="mt-6">
            <FeedTabs />
          </div>
        </div>
        <aside className="hidden flex-col gap-6 lg:flex">
          <DailyChallenge />
          <TrendingRail />
          <WhoToFollow />
        </aside>
      </div>
    </>
  );
}
