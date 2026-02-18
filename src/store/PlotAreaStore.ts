import { create } from 'zustand';

import type { PlotData } from './PlotDataStore';
import type { SideMenuData } from './SideMenuStore';

export interface PlotArea {
    enableLogAxis: boolean;
    plotTitle: string;
}

interface PlotAreaState {
    plotArea: PlotArea;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    loadProject: (plotArea: PlotArea) => void;
}

export const usePlotAreaStore = create<PlotAreaState>((set) => ({
    plotArea: {
        enableLogAxis: false,
        plotTitle: ''
    },
    setEnableLogAxis: (enableLogAxis) => set((state) => ({
        plotArea: { ...state.plotArea, enableLogAxis }
    })),
    setPlotTitle: (plotTitle) => set((state) => ({
        plotArea: { ...state.plotArea, plotTitle }
    })),
    loadProject: (plotArea) => set({ plotArea })
}));

import { generatePlotConfig } from '../utils/PlotlyHelpers';

export const createPlotConfig = (data: PlotData[], sideMenuData: SideMenuData, plotArea: PlotArea) => {
    return generatePlotConfig(data, sideMenuData, plotArea);
};
