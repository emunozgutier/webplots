import { create } from 'zustand';
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
}

interface TraceConfigState {
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
}

const DEFAULT_PALETTE = 'Default';

export const useTraceConfigStore = create<TraceConfigState>((set) => ({
    traceConfig: {
        traceCustomizations: {},
        colorPalette: DEFAULT_PALETTE,
        currentPaletteColors: [...(COLOR_PALETTES[DEFAULT_PALETTE] || [])]
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
    loadTraceConfig: (config) => set({ traceConfig: config })
}));
