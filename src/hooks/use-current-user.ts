"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/db";

export function useCurrentUser() {
  const supabase = createSupabaseBrowserClient();

  return useQuery({
    queryKey: ["current-user"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return (data as Profile | null) ?? null;
    },
  });
}
