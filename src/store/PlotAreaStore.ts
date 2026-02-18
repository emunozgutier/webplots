import { create } from 'zustand';

import type { PlotData } from './PlotDataStore';
import type { SideMenuData } from './SideMenuStore';

export interface PlotArea {
    enableLogAxis: boolean;
    plotTitle: string;
    xAxisTitle: string;
    yAxisTitle: string;
    xRange: [number, number] | null;
    yRange: [number, number] | null;
    showReceipt: boolean;
    isSettingsOpen: boolean;
}

interface PlotAreaState {
    plotArea: PlotArea;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    setXAxisTitle: (title: string) => void;
    setYAxisTitle: (title: string) => void;
    setXRange: (range: [number, number] | null) => void;
    setYRange: (range: [number, number] | null) => void;
    toggleReceipt: () => void;
    toggleSettings: () => void;
    loadProject: (plotArea: PlotArea) => void;
}

export const usePlotAreaStore = create<PlotAreaState>((set) => ({
    plotArea: {
        enableLogAxis: false,
        plotTitle: '',
        xAxisTitle: '',
        yAxisTitle: '',
        xRange: null,
        yRange: null,
        showReceipt: false, // Default to hidden
        isSettingsOpen: false
    },
    setEnableLogAxis: (enableLogAxis) => set((state) => ({
        plotArea: { ...state.plotArea, enableLogAxis }
    })),
    setPlotTitle: (plotTitle) => set((state) => ({
        plotArea: { ...state.plotArea, plotTitle }
    })),
    setXAxisTitle: (xAxisTitle) => set((state) => ({
        plotArea: { ...state.plotArea, xAxisTitle }
    })),
    setYAxisTitle: (yAxisTitle) => set((state) => ({
        plotArea: { ...state.plotArea, yAxisTitle }
    })),
    setXRange: (xRange) => set((state) => ({
        plotArea: { ...state.plotArea, xRange }
    })),
    setYRange: (yRange) => set((state) => ({
        plotArea: { ...state.plotArea, yRange }
    })),
    toggleReceipt: () => set((state) => ({
        plotArea: { ...state.plotArea, showReceipt: !state.plotArea.showReceipt }
    })),
    toggleSettings: () => set((state) => ({
        plotArea: { ...state.plotArea, isSettingsOpen: !state.plotArea.isSettingsOpen }
    })),
    loadProject: (plotArea) => set({ plotArea })
}));

import { generatePlotConfig } from '../utils/PlotlyHelpers';

export const createPlotConfig = (data: PlotData[], sideMenuData: SideMenuData, plotArea: PlotArea) => {
    return generatePlotConfig(data, sideMenuData, plotArea);
};
