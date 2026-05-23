// Editable text block on the meme canvas.
// x/y are normalized (0..1) so the same block survives canvas-size changes
// and the DOM overlay can position handles relative to the displayed canvas.

export interface TextBlock {
  id: string;
  text: string;
  x: number; // 0..1 — block's CENTER X relative to canvas width
  y: number; // 0..1 — block's CENTER Y relative to canvas height
  fontSize: number; // 0..1 — fraction of canvas width (e.g. 0.085 ≈ classic meme size)
  color: string;
  stroke: boolean; // classic meme: white fill, black stroke
  align: "left" | "center" | "right";
  upper: boolean; // force uppercase rendering
}

export function newTextBlock(overrides: Partial<TextBlock> = {}): TextBlock {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tb-${Math.random().toString(36).slice(2, 9)}`,
    text: "double click to edit",
    x: 0.5,
    y: 0.5,
    fontSize: 0.085,
    color: "#ffffff",
    stroke: true,
    align: "center",
    upper: true,
    ...overrides,
  };
}

export const DEFAULT_TOP_BLOCK = (): TextBlock => newTextBlock({ y: 0.1, text: "top text" });
export const DEFAULT_BOTTOM_BLOCK = (): TextBlock => newTextBlock({ y: 0.9, text: "bottom text" });
