import { notFound } from "next/navigation";
import { createSupabaseServerClient, getServerProfile } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import type { Profile } from "@/types/db";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!data) notFound();

  const viewer = await getServerProfile();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ProfileHeader profile={data as Profile} viewer={viewer} />
      <ProfileTabs profile={data as Profile} viewer={viewer} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return {
    title: `@${username} · MagicAthon`,
  };
}
