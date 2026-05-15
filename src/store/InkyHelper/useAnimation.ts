import { create } from 'zustand';

interface AnimationState {
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  targetPosition: { x: number; y: number } | null;
  setTargetPosition: (position: { x: number; y: number } | null) => void;
}

export const useAnimation = create<AnimationState>()((set) => ({
  isPlaying: true,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  speed: 1,
  setSpeed: (speed) => set({ speed }),
  targetPosition: null,
  setTargetPosition: (targetPosition) => set({ targetPosition }),
}));
