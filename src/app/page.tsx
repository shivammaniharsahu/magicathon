import { SiteShell } from "@/components/layout/site-shell";
import { getServerProfile } from "@/lib/supabase/server";
import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Showcase } from "@/components/landing/showcase";
import { CTA } from "@/components/landing/cta";

export default async function LandingPage() {
  const profile = await getServerProfile();
  return (
    <SiteShell profile={profile}>
      <Hero />
      <FeatureGrid />
      <Showcase />
      <CTA />
    </SiteShell>
  );
}
