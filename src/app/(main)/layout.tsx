import { SiteShell } from "@/components/layout/site-shell";
import { getServerProfile } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const profile = await getServerProfile();
  return <SiteShell profile={profile}>{children}</SiteShell>;
}
