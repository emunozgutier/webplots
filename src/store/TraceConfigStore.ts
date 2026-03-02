import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import { COLOR_PALETTES } from '../utils/ColorPalettes';

export interface TraceConfig {
    traceCustomizations: Record<string, {
        displayName?: string;
        color?: string;
        mode?: 'lines' | 'markers' | 'lines+markers';
        symbol?: string; // allow any plotly symbol string
        size?: number;
        histogramBins?: {
            start: number;
            end: number;
            size: number;
            binMode?: 'width' | 'count';
            count?: number;
            underflow: boolean;
            overflow: boolean;
        };
    }>;
    colorPalette: string;
    currentPaletteColors: string[];
    activeTraces: { fullTraceName: string; yCol: string; groupName: string }[];
}

export type TraceConfigState = {
    traceConfig: TraceConfig;
    setTraceCustomization: (columnName: string, settings: {
        displayName?: string;
        color?: string;
        mode?: 'lines' | 'markers' | 'lines+markers';
        symbol?: string;
        size?: number;
        histogramBins?: { start: number; end: number; size: number; binMode?: 'width' | 'count'; count?: number; underflow: boolean; overflow: boolean; };
    }) => void;
    setColorPalette: (paletteName: string) => void;
    setPaletteColorOrder: (colors: string[]) => void;
    updatePaletteColor: (index: number, color: string) => void;
    loadTraceConfig: (config: TraceConfig) => void;
    setActiveTraces: (traces: { fullTraceName: string; yCol: string; groupName: string }[]) => void;
}

const DEFAULT_PALETTE = 'Default';

export const createTraceConfigStore = () => createStore<TraceConfigState>()((set) => ({
    traceConfig: {
        traceCustomizations: {},
        colorPalette: DEFAULT_PALETTE,
        currentPaletteColors: [...(COLOR_PALETTES[DEFAULT_PALETTE] || [])],
        activeTraces: [],
    },
    setTraceCustomization: (columnName, settings) => set((state) => ({
        traceConfig: {
            ...state.traceConfig,
            traceCustomizations: {
                ...state.traceConfig.traceCustomizations,
                [columnName]: { ...state.traceConfig.traceCustomizations[columnName], ...settings }
            }
        }
    })),
    setColorPalette: (paletteName) => set((state) => ({
        traceConfig: {
            ...state.traceConfig,
            colorPalette: paletteName,
            currentPaletteColors: [...(COLOR_PALETTES[paletteName] || COLOR_PALETTES['Default'])]
        }
    })),
    setPaletteColorOrder: (colors) => set((state) => ({
        traceConfig: { ...state.traceConfig, currentPaletteColors: colors }
    })),
    updatePaletteColor: (index, color) => set((state) => {
        const newColors = [...state.traceConfig.currentPaletteColors];
        if (index >= 0 && index < newColors.length) {
            newColors[index] = color;
        }
        return {
            traceConfig: { ...state.traceConfig, currentPaletteColors: newColors }
        };
    }),
    loadTraceConfig: (config) => set({ traceConfig: config }),
    setActiveTraces: (traces) => set((state) => ({ traceConfig: { ...state.traceConfig, activeTraces: traces } }))
}));

export const useTraceConfigStore = <T = TraceConfigState>(selector: (state: TraceConfigState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useTraceConfigStore must be used within WorkspaceProvider');
    return useStore(context.traceConfigStore, selector);
};
