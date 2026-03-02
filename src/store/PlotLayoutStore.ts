import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export interface PlotLayout {
    enableLogAxis: boolean;
    plotTitle: string;
    xAxisTitle: string;
    yAxisTitle: string;
    xRange: [number, number] | null;
    yRange: [number, number] | null;
    histogramBarmode?: 'overlay' | 'stack' | 'group';
}

export type PlotLayoutState = {
    plotLayout: PlotLayout;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    setXAxisTitle: (title: string) => void;
    setYAxisTitle: (title: string) => void;
    setXRange: (range: [number, number] | null) => void;
    setYRange: (range: [number, number] | null) => void;
    setHistogramBarmode: (barmode: 'overlay' | 'stack' | 'group') => void;
    loadProject: (plotLayout: PlotLayout) => void;
}

export const createPlotLayoutStore = () => createStore<PlotLayoutState>()((set) => ({
    plotLayout: {
        enableLogAxis: false,
        plotTitle: '',
        xAxisTitle: '',
        yAxisTitle: '',
        yRange: null,
        xRange: null,
        histogramBarmode: 'overlay'
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
    setHistogramBarmode: (histogramBarmode) => set((state) => ({
        plotLayout: { ...state.plotLayout, histogramBarmode }
    })),
    loadProject: (plotLayout) => set({ plotLayout })
}));

export const usePlotLayoutStore = <T = PlotLayoutState>(selector: (state: PlotLayoutState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('usePlotLayoutStore must be used within WorkspaceProvider');
    return useStore(context.plotLayoutStore, selector);
};
