import { create } from 'zustand';

export type TraceStats = {
    filtered: number;
    min: number;
    max: number;
    avg: number;
};

export type InkRatioState = {
    inkRatio: number; // 0 to 1
    filteredStats: Record<string, TraceStats>;
    // Fixed constants for now, but could be dynamic later
    chartWidth: number;
    chartHeight: number;
    pointRadius: number;
    // Custom limit
    useCustomRadius: boolean;
    customRadius: number;
    absorptionMode: 'none' | 'size' | 'glow' | 'glass';
    setAbsorptionMode: (mode: 'none' | 'size' | 'glow' | 'glass') => void;

    absorbedPoint: 'left' | 'right' | 'random';
    setAbsorbedPoint: (point: 'left' | 'right' | 'random') => void;

    maxRadiusRatio: number; // 1 to 10
    setMaxRadiusRatio: (ratio: number) => void;

    setInkRatio: (ratio: number) => void;

    setUseCustomRadius: (use: boolean) => void;
    setCustomRadius: (radius: number) => void;

    setFilteredStats: (stats: Record<string, TraceStats>) => void;
    setChartDimensions: (width: number, height: number) => void;
}

export const useInkRatioStore = create<InkRatioState>()(
    (set) => ({
        inkRatio: 0, // Default to 0% overlap (max filtering)
        absorptionMode: 'none',
        absorbedPoint: 'random',
        filteredStats: {},
        chartWidth: 1280,
        chartHeight: 720,
        pointRadius: 8,
        useCustomRadius: false,
        customRadius: 20, // Default to visible amount
        maxRadiusRatio: 3, // Default ratio
        setInkRatio: (ratio) => set({ inkRatio: ratio }),
        setAbsorptionMode: (mode) => set({ absorptionMode: mode }),
        setAbsorbedPoint: (point) => set({ absorbedPoint: point }),
        setMaxRadiusRatio: (ratio) => set({ maxRadiusRatio: ratio }),
        setUseCustomRadius: (use) => set({ useCustomRadius: use }),
        setCustomRadius: (radius) => set({ customRadius: radius }),
        setFilteredStats: (stats) => set({ filteredStats: stats }),
        setChartDimensions: (width, height) => set({ chartWidth: width, chartHeight: height })
    })
);

