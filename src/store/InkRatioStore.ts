import { create } from 'zustand';

interface InkRatioState {
    inkRatio: number; // 0 to 1
    filteredStats: Record<string, number>;
    // Fixed constants for now, but could be dynamic later
    chartWidth: number;
    chartHeight: number;
    pointRadius: number;
    // Custom limit
    useCustomRadius: boolean;
    customRadius: number;
    setInkRatio: (ratio: number) => void;

    setUseCustomRadius: (use: boolean) => void;
    setCustomRadius: (radius: number) => void;

    setFilteredStats: (stats: Record<string, number>) => void;
    setChartDimensions: (width: number, height: number) => void;
}

export const useInkRatioStore = create<InkRatioState>((set) => ({
    inkRatio: 1, // Default to 100% overlap (no filtering)
    filteredStats: {},
    chartWidth: 1280,
    chartHeight: 720,
    pointRadius: 8,
    useCustomRadius: false,
    customRadius: 20, // Default to visible amount
    setInkRatio: (ratio) => set({ inkRatio: ratio }),
    setUseCustomRadius: (use) => set({ useCustomRadius: use }),
    setCustomRadius: (radius) => set({ customRadius: radius }),
    setFilteredStats: (stats) => set({ filteredStats: stats }),
    setChartDimensions: (width, height) => set({ chartWidth: width, chartHeight: height })
}));
