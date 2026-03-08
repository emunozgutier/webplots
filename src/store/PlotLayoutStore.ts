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
    legendOrientation?: 'auto' | 'right' | 'bottom' | 'hidden';
    pointTip?: 'default' | 'xy' | 'xy_absorbed' | 'xy_trace';
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
    setLegendOrientation: (orientation: 'auto' | 'right' | 'bottom' | 'hidden') => void;
    setPointTip: (tip: 'default' | 'xy' | 'xy_absorbed' | 'xy_trace') => void;
    loadProject: (plotLayout: PlotLayout) => void;
}

export const createPlotLayoutStore = () => createStore<PlotLayoutState>()(
    (set) => ({
        plotLayout: {
            enableLogAxis: false,
            plotTitle: '',
            xAxisTitle: '',
            yAxisTitle: '',
            yRange: null,
            xRange: null,
            histogramBarmode: 'overlay',
            legendOrientation: 'auto',
            pointTip: 'default'
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
        setLegendOrientation: (legendOrientation) => set((state) => ({
            plotLayout: { ...state.plotLayout, legendOrientation }
        })),
        setPointTip: (pointTip) => set((state) => ({
            plotLayout: { ...state.plotLayout, pointTip }
        })),
        loadProject: (plotLayout) => set({ plotLayout })
    })
);

export const usePlotLayoutStore = <T = PlotLayoutState>(selector: (state: PlotLayoutState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('usePlotLayoutStore must be used within WorkspaceProvider');
    return useStore(context.plotLayoutStore, selector);
};
