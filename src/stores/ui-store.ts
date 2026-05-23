import { create } from "zustand";

interface UIState {
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  toggleCreate: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  createOpen: false,
  openCreate: () => set({ createOpen: true }),
  closeCreate: () => set({ createOpen: false }),
  toggleCreate: () => set((s) => ({ createOpen: !s.createOpen })),
}));
