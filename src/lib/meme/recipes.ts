// Reusable meme recipes — each one is a JSON-shaped configuration that
// composes:
//   1. An AI image-generation prompt template (with {slot} placeholders).
//   2. A list of named slots the user fills in.
//   3. A list of text-block layouts that pull text from those slots and
//      position it on the canvas.
//
// When the user picks a recipe + fills slots + clicks Apply, we substitute
// values into the prompt + position the text blocks, then trigger normal
// image generation. The result is a fresh, AI-generated take on a classic
// meme format — different every time, never a static template image.

import { newTextBlock, type TextBlock } from "./types";

export interface RecipeSlot {
  key: string;
  label: string;
  placeholder: string;
}

export interface RecipeBlock {
  slot: string; // which slot's value fills this block
  x: number; // 0..1
  y: number; // 0..1
  fontSize: number; // 0..1 fraction of canvas width
  color?: string;
  align?: "left" | "center" | "right";
  upper?: boolean;
  stroke?: boolean;
}

export interface MemeRecipe {
  id: string;
  label: string;
  emoji: string;
  description: string;
  // Plain-English hint of the meme's joke structure for the AI's downstream call.
  format: string;
  slots: RecipeSlot[];
  // Use {slotKey} placeholders. Substituted at apply time.
  imagePromptTemplate: string;
  blocks: RecipeBlock[];
}

// ============================================================
// The recipes
// ============================================================

export const MEME_RECIPES: MemeRecipe[] = [
  {
    id: "reject-choose",
    label: "Reject / Choose",
    emoji: "🎵",
    description: "Two options: one you wave away, one you embrace. Classic two-panel comparison.",
    format: "comparison-2",
    slots: [
      { key: "reject", label: "What you're rejecting", placeholder: "doing the dishes" },
      { key: "choose", label: "What you're choosing", placeholder: "scrolling for three hours" },
    ],
    imagePromptTemplate:
      "a vertical 2-panel photographic composite split horizontally in the middle. top half: a person dismissively turning their head away with one hand raised to block, plain studio backdrop. bottom half: the same person grinning enthusiastically and pointing forward at the camera, same backdrop. clear panel divider, photoreal candid portrait photography, natural studio lighting, sharp focus, no text, no captions, no writing",
    blocks: [
      { slot: "reject", x: 0.72, y: 0.25, fontSize: 0.055, align: "center", upper: true, stroke: true },
      { slot: "choose", x: 0.72, y: 0.75, fontSize: 0.055, align: "center", upper: true, stroke: true },
    ],
  },

  {
    id: "distracted",
    label: "Distracted",
    emoji: "👀",
    description: "Three figures: you, your commitment, and the tempting thing your eyes keep drifting to.",
    format: "comparison-3",
    slots: [
      { key: "you", label: "You", placeholder: "me" },
      { key: "current", label: "Your commitment", placeholder: "my sleep schedule" },
      { key: "tempting", label: "The temptation", placeholder: "one more episode at 2am" },
    ],
    imagePromptTemplate:
      "candid street photograph: a person walking on a sidewalk hand-in-hand with their partner, but sharply turning their head backward to stare at someone walking the other direction. the partner looks annoyed. three distinct people clearly visible from a side angle, daytime urban background, photoreal documentary photography, natural daylight, 35mm lens look, no text, no captions, no writing",
    blocks: [
      { slot: "tempting", x: 0.18, y: 0.88, fontSize: 0.038, align: "center", upper: true, stroke: true },
      { slot: "you", x: 0.5, y: 0.88, fontSize: 0.038, align: "center", upper: true, stroke: true },
      { slot: "current", x: 0.82, y: 0.88, fontSize: 0.038, align: "center", upper: true, stroke: true },
    ],
  },

  {
    id: "two-buttons",
    label: "Two Buttons",
    emoji: "🔘",
    description: "An anxious figure agonizing between two equally tempting choices.",
    format: "decision-2",
    slots: [
      { key: "option_a", label: "Button A", placeholder: "be productive" },
      { key: "option_b", label: "Button B", placeholder: "open the fridge for the 9th time" },
    ],
    imagePromptTemplate:
      "a person agonizing while looking down at a control panel with two large unmarked round buttons side by side. visible beads of sweat on the forehead, hand hovering over the buttons, dramatic indecision, photoreal documentary photo, natural lighting, sharp focus, no text, no captions, no writing",
    blocks: [
      { slot: "option_a", x: 0.3, y: 0.4, fontSize: 0.038, align: "center", upper: true, stroke: true },
      { slot: "option_b", x: 0.7, y: 0.4, fontSize: 0.038, align: "center", upper: true, stroke: true },
    ],
  },

  {
    id: "galaxy-brain",
    label: "Galaxy Brain",
    emoji: "🧠",
    description: "Escalation — four ideas that go from basic to cosmic.",
    format: "escalation-4",
    slots: [
      { key: "step1", label: "Level 1 (basic)", placeholder: "remember the password" },
      { key: "step2", label: "Level 2", placeholder: "save it in a notes app" },
      { key: "step3", label: "Level 3", placeholder: "use a password manager" },
      { key: "step4", label: "Level 4 (cosmic)", placeholder: "use the same password everywhere on purpose" },
    ],
    imagePromptTemplate:
      "a 4-panel vertical photo grid stacked top to bottom, each panel the same person's portrait from the same angle on a plain dark backdrop. panel 1: calm expression, faint warm glow above the head. panel 2: thoughtful expression, brighter halo of light. panel 3: enlightened expression, radiant aura. panel 4: awe-struck expression, swirling cosmic nebula effect around the head. clear horizontal dividers between panels, photoreal portrait photography, dramatic studio lighting, no text, no captions, no writing",
    blocks: [
      { slot: "step1", x: 0.72, y: 0.125, fontSize: 0.032, align: "center", upper: true, stroke: true },
      { slot: "step2", x: 0.72, y: 0.375, fontSize: 0.032, align: "center", upper: true, stroke: true },
      { slot: "step3", x: 0.72, y: 0.625, fontSize: 0.032, align: "center", upper: true, stroke: true },
      { slot: "step4", x: 0.72, y: 0.875, fontSize: 0.032, align: "center", upper: true, stroke: true },
    ],
  },

  {
    id: "hot-take",
    label: "Hot Take",
    emoji: "🪧",
    description: "One person, one sign, one opinion ready to be defended.",
    format: "single-panel",
    slots: [
      { key: "take", label: "Your hot take", placeholder: "pineapple absolutely belongs on pizza" },
    ],
    imagePromptTemplate:
      "a confident person sitting at a folding table outdoors on a college campus quad, a coffee cup beside them and a small blank white rectangular sign mounted upright on the table facing the camera, friendly relaxed expression, candid photograph, photoreal, natural daylight, shallow depth of field, the sign itself is completely blank, no text, no captions, no writing",
    blocks: [
      { slot: "take", x: 0.5, y: 0.72, fontSize: 0.045, align: "center", upper: true, stroke: true, color: "#000000" },
    ],
  },

  {
    id: "mock-voice",
    label: "Mock Voice",
    emoji: "🤡",
    description: "Repeat the absurd thing someone said in MoCkInG cApS. Often: your past self.",
    format: "single-panel",
    slots: [
      { key: "quote", label: "What's being mocked", placeholder: "i'll just have one snack and stop" },
    ],
    imagePromptTemplate:
      "a person making an exaggerated mocking expression, leaning forward with arms bent out and palms up, theatrically squished face, eyes wide and uneven, comedic mocking pose, candid documentary photograph, photoreal, natural lighting, plain neutral background, sharp focus, no text, no captions, no writing",
    blocks: [
      // Note: we don't enforce alternating caps here because the user types
      // it however they want. If they type "iLl JuSt HaVe ONe SnAcK" we leave
      // it. The `upper: false` flag preserves their casing.
      { slot: "quote", x: 0.5, y: 0.12, fontSize: 0.05, align: "center", upper: false, stroke: true },
    ],
  },
];

// ============================================================
// Apply a recipe with concrete slot values.
// ============================================================

export interface AppliedRecipe {
  prompt: string;
  blocks: TextBlock[];
}

export function applyRecipe(
  recipe: MemeRecipe,
  values: Record<string, string>,
): AppliedRecipe {
  // 1. Substitute slot values into the image prompt.
  let prompt = recipe.imagePromptTemplate;
  // Each placeholder is referenced for the AI's downstream call so the
  // generated image hints at what slots will go where. We keep the substitution
  // optional — if the user filled in nothing, the placeholder stays as the
  // descriptive text and the prompt still produces a sensible image.
  for (const slot of recipe.slots) {
    const v = (values[slot.key] || "").trim();
    prompt = prompt.replace(new RegExp(`\\{${slot.key}\\}`, "g"), v || slot.placeholder);
  }

  // 2. Build text blocks. Each recipe block becomes a real TextBlock with
  //    the user's text + the recipe's layout coords.
  const blocks: TextBlock[] = recipe.blocks.map((b) =>
    newTextBlock({
      text: (values[b.slot] || "").trim() || recipe.slots.find((s) => s.key === b.slot)?.placeholder || "",
      x: b.x,
      y: b.y,
      fontSize: b.fontSize,
      color: b.color ?? "#ffffff",
      align: b.align ?? "center",
      upper: b.upper ?? true,
      stroke: b.stroke ?? true,
    }),
  );

  return { prompt, blocks };
}
