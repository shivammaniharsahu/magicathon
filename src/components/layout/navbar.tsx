"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flame, Home, Plus, Search, User as UserIcon } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import type { Profile } from "@/types/db";

const NAV_LINKS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
];

export function Navbar({
  profile,
  onCreate,
}: {
  profile: Profile | null;
  onCreate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
          </Button>

          <Button onClick={onCreate} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" />
            Post
          </Button>
          <Button onClick={onCreate} size="icon" className="sm:hidden" aria-label="Create post">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          {profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full ring-offset-background transition focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2"
                  aria-label="Profile menu"
                >
                  <UserAvatar
                    src={profile.avatar_url}
                    name={profile.display_name ?? profile.username}
                    className="h-9 w-9"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  ✨ Demo mode · @{profile.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${profile.username}`}>
                    <UserIcon className="h-4 w-4" />
                    View profile
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
