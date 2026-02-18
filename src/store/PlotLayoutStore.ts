import { create } from 'zustand';

import type { PlotData } from './PlotDataStore';
import type { SideMenuData } from './SideMenuStore';

export interface PlotLayout {
    enableLogAxis: boolean;
    plotTitle: string;
    xAxisTitle: string;
    yAxisTitle: string;
    xRange: [number, number] | null;
    yRange: [number, number] | null;
    traceCustomizations: Record<string, { displayName?: string; color?: string }>;
    colorPalette: string;
    currentPaletteColors: string[];
}

interface PlotLayoutState {
    plotLayout: PlotLayout;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    setXAxisTitle: (title: string) => void;
    setYAxisTitle: (title: string) => void;
    setXRange: (range: [number, number] | null) => void;
    setYRange: (range: [number, number] | null) => void;
    setTraceCustomization: (columnName: string, settings: { displayName?: string; color?: string }) => void;
    setColorPalette: (paletteName: string) => void;
    setPaletteColorOrder: (colors: string[]) => void;
    updatePaletteColor: (index: number, color: string) => void;
    loadProject: (plotLayout: PlotLayout) => void;
}

const DEFAULT_PALETTE = 'Default';

export const usePlotLayoutStore = create<PlotLayoutState>((set) => ({
    plotLayout: {
        enableLogAxis: false,
        plotTitle: '',
        xAxisTitle: '',
        yAxisTitle: '',
        yRange: null,
        xRange: null,
        traceCustomizations: {},
        colorPalette: DEFAULT_PALETTE,
        currentPaletteColors: [...(COLOR_PALETTES[DEFAULT_PALETTE] || [])]
    },
    setEnableLogAxis: (enableLogAxis) => set((state) => ({
        plotLayout: { ...state.plotLayout, enableLogAxis }
    })),
    setPlotTitle: (plotTitle) => set((state) => ({
        plotLayout: { ...state.plotLayout, plotTitle }
    })),
    setXAxisTitle: (xAxisTitle) => set((state) => ({
        plotLayout: { ...state.plotLayout, xAxisTitle }
    })),
    setYAxisTitle: (yAxisTitle) => set((state) => ({
        plotLayout: { ...state.plotLayout, yAxisTitle }
    })),
    setXRange: (xRange) => set((state) => ({
        plotLayout: { ...state.plotLayout, xRange }
    })),
    setYRange: (yRange) => set((state) => ({
        plotLayout: { ...state.plotLayout, yRange }
    })),
    setTraceCustomization: (columnName, settings) => set((state) => ({
        plotLayout: {
            ...state.plotLayout,
            traceCustomizations: {
                ...state.plotLayout.traceCustomizations,
                [columnName]: { ...state.plotLayout.traceCustomizations[columnName], ...settings }
            }
        }
    })),
    setColorPalette: (paletteName) => set((state) => ({
        plotLayout: {
            ...state.plotLayout,
            colorPalette: paletteName,
            currentPaletteColors: [...(COLOR_PALETTES[paletteName] || COLOR_PALETTES['Default'])]
        }
    })),
    setPaletteColorOrder: (colors) => set((state) => ({
        plotLayout: { ...state.plotLayout, currentPaletteColors: colors }
    })),
    updatePaletteColor: (index, color) => set((state) => {
        const newColors = [...state.plotLayout.currentPaletteColors];
        if (index >= 0 && index < newColors.length) {
            newColors[index] = color;
        }
        return {
            plotLayout: { ...state.plotLayout, currentPaletteColors: newColors }
        };
    }),
    loadProject: (plotLayout) => set({ plotLayout })
}));


import { generatePlotConfig } from '../utils/PlotlyHelpers';
import { COLOR_PALETTES } from '../utils/ColorPalettes';

export const createPlotConfig = (data: PlotData[], sideMenuData: SideMenuData, plotLayout: PlotLayout) => {
    return generatePlotConfig(data, sideMenuData, plotLayout);
};
