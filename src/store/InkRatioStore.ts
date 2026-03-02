import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

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
    absorptionMode: 'none' | 'size' | 'glow';
    setAbsorptionMode: (mode: 'none' | 'size' | 'glow') => void;

    maxRadiusRatio: number; // 1 to 10
    setMaxRadiusRatio: (ratio: number) => void;

    setInkRatio: (ratio: number) => void;

    setUseCustomRadius: (use: boolean) => void;
    setCustomRadius: (radius: number) => void;

    setFilteredStats: (stats: Record<string, TraceStats>) => void;
    setChartDimensions: (width: number, height: number) => void;
}

export const createInkRatioStore = () => createStore<InkRatioState>()((set) => ({
    inkRatio: 0, // Default to 0% overlap (max filtering)
    absorptionMode: 'none',
    filteredStats: {},
    chartWidth: 1280,
    chartHeight: 720,
    pointRadius: 8,
    useCustomRadius: false,
    customRadius: 20, // Default to visible amount
    maxRadiusRatio: 3, // Default ratio
    setInkRatio: (ratio) => set({ inkRatio: ratio }),
    setAbsorptionMode: (mode) => set({ absorptionMode: mode }),
    setMaxRadiusRatio: (ratio) => set({ maxRadiusRatio: ratio }),
    setUseCustomRadius: (use) => set({ useCustomRadius: use }),
    setCustomRadius: (radius) => set({ customRadius: radius }),
    setFilteredStats: (stats) => set({ filteredStats: stats }),
    setChartDimensions: (width, height) => set({ chartWidth: width, chartHeight: height })
}));

export const useInkRatioStore = <T = InkRatioState>(selector: (state: InkRatioState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useInkRatioStore must be used within WorkspaceProvider');
    return useStore(context.inkRatioStore, selector);
};
