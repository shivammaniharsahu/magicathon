"use client";

import confetti from "canvas-confetti";

export function fireLaughConfetti() {
  if (typeof window === "undefined") return;
  const defaults = {
    spread: 70,
    ticks: 60,
    gravity: 0.9,
    decay: 0.92,
    startVelocity: 28,
    scalar: 1.05,
  };
  confetti({
    ...defaults,
    particleCount: 28,
    origin: { y: 0.7 },
    colors: ["#a78bfa", "#ec4899", "#fbbf24", "#22d3ee"],
  });
}
