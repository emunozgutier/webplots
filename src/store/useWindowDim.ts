import { create } from 'zustand';

export type DimensionPreset = 'actual' | 'iphone' | 'ipad' | 'small-monitor' | 'large-monitor';

export interface ViewportSize {
    width: number;
    height: number;
}

export const PRESET_SIZES: Record<Exclude<DimensionPreset, 'actual'>, ViewportSize> = {
    'iphone': { width: 390, height: 844 },
    'ipad': { width: 820, height: 1180 },
    'small-monitor': { width: 1024, height: 768 },
    'large-monitor': { width: 1920, height: 1080 }
};

interface WindowDimState {
    width: number;
    height: number;
    actualWidth: number;
    actualHeight: number;
    preset: DimensionPreset;
    setPreset: (preset: DimensionPreset) => void;
    updateActualDimensions: (width: number, height: number) => void;
}

export const useWindowDim = create<WindowDimState>()((set) => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    actualWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    actualHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    preset: 'actual',

    setPreset: (preset) => set((state) => {
        if (preset === 'actual') {
            return {
                preset,
                width: state.actualWidth,
                height: state.actualHeight
            };
        } else {
            const size = PRESET_SIZES[preset];
            return {
                preset,
                width: size.width,
                height: size.height
            };
        }
    }),

    updateActualDimensions: (w, h) => set((state) => {
        const updates: Partial<WindowDimState> = {
            actualWidth: w,
            actualHeight: h
        };
        if (state.preset === 'actual') {
            updates.width = w;
            updates.height = h;
        }
        return updates;
    })
}));
