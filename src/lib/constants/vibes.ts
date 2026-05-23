export type VibeKey = "funny" | "weird" | "relatable" | "rant" | "wholesome";

export interface Vibe {
  key: VibeKey;
  label: string;
  emoji: string;
  description: string;
  color: string;
  ring: string;
  bg: string;
}

export const VIBES: Vibe[] = [
  {
    key: "funny",
    label: "Funny",
    emoji: "😂",
    description: "Pure comedy energy",
    color: "text-vibe-funny",
    ring: "ring-vibe-funny/40",
    bg: "bg-vibe-funny/15",
  },
  {
    key: "weird",
    label: "Weird",
    emoji: "👽",
    description: "Out there in the best way",
    color: "text-vibe-weird",
    ring: "ring-vibe-weird/40",
    bg: "bg-vibe-weird/15",
  },
  {
    key: "relatable",
    label: "Relatable",
    emoji: "🫠",
    description: "Felt this in my bones",
    color: "text-vibe-relatable",
    ring: "ring-vibe-relatable/40",
    bg: "bg-vibe-relatable/15",
  },
  {
    key: "rant",
    label: "Rant",
    emoji: "😤",
    description: "Let it out",
    color: "text-vibe-rant",
    ring: "ring-vibe-rant/40",
    bg: "bg-vibe-rant/15",
  },
  {
    key: "wholesome",
    label: "Wholesome",
    emoji: "🥰",
    description: "A little serotonin",
    color: "text-vibe-wholesome",
    ring: "ring-vibe-wholesome/40",
    bg: "bg-vibe-wholesome/15",
  },
];

export const VIBE_BY_KEY = Object.fromEntries(VIBES.map((v) => [v.key, v])) as Record<VibeKey, Vibe>;

export type Audience = "everyone" | "followers" | "vibe-match";

export const AUDIENCES: { key: Audience; label: string; emoji: string; description: string }[] = [
  { key: "everyone", label: "Everyone", emoji: "🌍", description: "Show to the whole internet" },
  { key: "followers", label: "Followers", emoji: "👥", description: "Just the people who get you" },
  { key: "vibe-match", label: "Vibe Match", emoji: "✨", description: "Only matched humor vibes" },
];
