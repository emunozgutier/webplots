import { create } from 'zustand';

export type DisplayMode = 'none' | 'subtitle' | 'background';

export interface AnimationSideMenuData {
    animationColumn: string;
    animationValue: string | number | null;
    displayMode: DisplayMode;
    isPlaying: boolean;
    speedMultiplier: number;
}

export type AnimationSideMenuState = {
    animationData: AnimationSideMenuData;
    setAnimationData: (data: Partial<AnimationSideMenuData>) => void;
    setAnimationColumn: (column: string) => void;
    setAnimationValue: (value: string | number | null) => void;
    setDisplayMode: (mode: DisplayMode) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setSpeedMultiplier: (speedMultiplier: number) => void;
}

export const useAnimationSideMenuStore = create<AnimationSideMenuState>()(
    (set) => ({
        animationData: {
            animationColumn: '',
            animationValue: null,
            displayMode: 'subtitle',
            isPlaying: false,
            speedMultiplier: 1,
        },
        setAnimationData: (data) =>
            set((state) => ({
                animationData: { ...state.animationData, ...data }
            })),
        setAnimationColumn: (column) =>
            set((state) => ({
                animationData: { ...state.animationData, animationColumn: column }
            })),
        setAnimationValue: (value) =>
            set((state) => ({
                animationData: { ...state.animationData, animationValue: value }
            })),
        setDisplayMode: (mode) =>
            set((state) => ({
                animationData: { ...state.animationData, displayMode: mode }
            })),
        setIsPlaying: (isPlaying) =>
            set((state) => ({
                animationData: { ...state.animationData, isPlaying }
            })),
        setSpeedMultiplier: (speedMultiplier) =>
            set((state) => ({
                animationData: { ...state.animationData, speedMultiplier }
            })),
    })
);

