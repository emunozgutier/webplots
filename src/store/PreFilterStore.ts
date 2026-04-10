import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PreFilterMode = 'none' | 'uniform' | 'random' | 'inkRatio';

export interface PreFilterState {
    mode: PreFilterMode;
    uniformStep: number;
    randomSampleCount: number;
    inkRatio: number;
    // New density-basis columns for global inkRatio pre-filter
    densityX: string | null;
    densityY: string | null;
    
    setMode: (mode: PreFilterMode) => void;
    setUniformStep: (step: number) => void;
    setRandomSampleCount: (count: number) => void;
    setInkRatio: (ratio: number) => void;
    setDensityColumns: (x: string | null, y: string | null) => void;
}

export const usePreFilterStore = create<PreFilterState>()(
    persist(
        (set) => ({
            mode: 'none',
            uniformStep: 10,
            randomSampleCount: 100000,
            inkRatio: 0.5,
            densityX: null,
            densityY: null,

            setMode: (mode) => set({ mode }),
            setUniformStep: (uniformStep) => set({ uniformStep }),
            setRandomSampleCount: (randomSampleCount) => set({ randomSampleCount }),
            setInkRatio: (inkRatio) => set({ inkRatio }),
            setDensityColumns: (densityX, densityY) => set({ densityX, densityY }),
        }),
        {
            name: 'pre-filter-storage',
        }
    )
);
