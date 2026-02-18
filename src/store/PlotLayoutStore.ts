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
    showReceipt: boolean;
    isSettingsOpen: boolean;
}

interface PlotLayoutState {
    plotLayout: PlotLayout;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    setXAxisTitle: (title: string) => void;
    setYAxisTitle: (title: string) => void;
    setXRange: (range: [number, number] | null) => void;
    setYRange: (range: [number, number] | null) => void;
    toggleReceipt: () => void;
    toggleSettings: () => void;
    loadProject: (plotLayout: PlotLayout) => void;
}

export const usePlotLayoutStore = create<PlotLayoutState>((set) => ({
    plotLayout: {
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
    toggleReceipt: () => set((state) => ({
        plotLayout: { ...state.plotLayout, showReceipt: !state.plotLayout.showReceipt }
    })),
    toggleSettings: () => set((state) => ({
        plotLayout: { ...state.plotLayout, isSettingsOpen: !state.plotLayout.isSettingsOpen }
    })),
    loadProject: (plotLayout) => set({ plotLayout })
}));

import { generatePlotConfig } from '../utils/PlotlyHelpers';

export const createPlotConfig = (data: PlotData[], sideMenuData: SideMenuData, plotLayout: PlotLayout) => {
    return generatePlotConfig(data, sideMenuData, plotLayout);
};
