"use client";

import * as React from "react";
import { Navbar } from "./navbar";
import { CreatePostDialog } from "@/components/post/create-post-dialog";
import { useUIStore } from "@/stores/ui-store";
import type { Profile } from "@/types/db";

interface SiteShellProps {
  profile: Profile | null;
  children: React.ReactNode;
}

export function SiteShell({ profile, children }: SiteShellProps) {
  const { createOpen, openCreate, closeCreate } = useUIStore();

  return (
    <>
      <Navbar profile={profile} onCreate={profile ? openCreate : undefined} />
      <main className="flex-1">{children}</main>
      {profile && (
        <CreatePostDialog
          open={createOpen}
          onOpenChange={(open) => (open ? openCreate() : closeCreate())}
          profile={profile}
        />
      )}
      <footer className="mt-12 border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        <p>
          Made with chaos and{" "}
          <span className="gradient-text-static font-semibold">caffeine</span>. Built for laughs,
          designed for humans.
        </p>
      </footer>
    </>
  );
}
