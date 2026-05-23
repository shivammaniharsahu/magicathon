export interface Challenge {
  id: string;
  emoji: string;
  title: string;
  prompt: string;
}

export const CHALLENGES: Challenge[] = [
  { id: "c1", emoji: "🍳", title: "Worst Cooking Disaster", prompt: "Post your worst cooking disaster." },
  { id: "c2", emoji: "💼", title: "Explain Your Job Badly", prompt: "Explain your job like a five-year-old explaining a heist." },
  { id: "c3", emoji: "🧦", title: "Lost Sock Theory", prompt: "Where do the lost socks really go? Defend your theory." },
  { id: "c4", emoji: "📱", title: "Most Cursed Screen Time", prompt: "Share the most cursed app you opened today and why." },
  { id: "c5", emoji: "🐱", title: "Pet's Inner Monologue", prompt: "Write your pet's diary entry from today." },
  { id: "c6", emoji: "👀", title: "Caught in 4K", prompt: "What's the most embarrassing thing your camera roll knows?" },
  { id: "c7", emoji: "🥲", title: "Adult Fail of the Week", prompt: "Confess your most pathetic attempt at being an adult." },
  { id: "c8", emoji: "🛸", title: "Conspiracy You Believe", prompt: "Drop a low-stakes conspiracy you ride for." },
];

// Picks a stable daily challenge keyed to UTC day so SSR/CSR agree.
export function getDailyChallenge(): Challenge {
  const now = new Date();
  const dayIndex = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
  const idx = ((dayIndex % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
  return CHALLENGES[idx]!;
}
