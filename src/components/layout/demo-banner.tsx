import { AlertCircle } from "lucide-react";

export function DemoNotReadyBanner() {
  return (
    <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6">
      <div className="rounded-2xl border border-amber/30 bg-amber/10 p-4 text-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-amber">Demo mode isn&apos;t initialized yet.</p>
            <p className="text-amber-200/90">
              Run{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">
                supabase/demo-mode.sql
              </code>{" "}
              in your Supabase SQL editor to enable posting, reactions, and load the sample feed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
