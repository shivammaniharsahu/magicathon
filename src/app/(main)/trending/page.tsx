import { FeedList } from "@/components/feed/feed-list";
import { DailyChallenge } from "@/components/feed/daily-challenge";
import { WhoToFollow } from "@/components/feed/who-to-follow";

export default function TrendingPage() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Trending <span>🔥</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          What the internet is laughing at right now.
        </p>
        <div className="mt-6">
          <FeedList tab="for-you" />
        </div>
      </div>
      <aside className="hidden flex-col gap-6 lg:flex">
        <DailyChallenge />
        <WhoToFollow />
      </aside>
    </div>
  );
}
