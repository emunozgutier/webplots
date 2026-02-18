import { create } from 'zustand';

export interface PlotLayout {
    enableLogAxis: boolean;
    plotTitle: string;
    xAxisTitle: string;
    yAxisTitle: string;
    xRange: [number, number] | null;
    yRange: [number, number] | null;
}

interface PlotLayoutState {
    plotLayout: PlotLayout;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    setXAxisTitle: (title: string) => void;
    setYAxisTitle: (title: string) => void;
    setXRange: (range: [number, number] | null) => void;
    setYRange: (range: [number, number] | null) => void;
    loadProject: (plotLayout: PlotLayout) => void;
}

export const usePlotLayoutStore = create<PlotLayoutState>((set) => ({
    plotLayout: {
        enableLogAxis: false,
        plotTitle: '',
        xAxisTitle: '',
        yAxisTitle: '',
        yRange: null,
        xRange: null
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
    loadProject: (plotLayout) => set({ plotLayout })
}));

