import { create } from 'zustand';
import type { Layout, Data } from 'plotly.js';
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

export const createPlotConfig = (data: PlotData[], sideMenuData: SideMenuData, plotArea: PlotArea) => {
    const { xAxis, yAxis } = sideMenuData;
    const { enableLogAxis, plotTitle } = plotArea;
    const hasData = data.length > 0 && !!xAxis && yAxis.length > 0;

    if (!hasData) {
        return {
            plotData: [] as Data[],
            layout: {},
            hasData: false
        };
    }

    const x = data.map(row => row[xAxis]);

    // Create a trace for each Y-axis column
    const plotData: Data[] = yAxis.map(yCol => ({
        x: x,
        y: data.map(row => row[yCol]),
        mode: 'lines',
        type: 'scatter',
        name: yCol
    }));

    return {
        plotData,
        layout: {
            width: undefined,
            height: undefined,
            title: { text: plotTitle || `Plot: ${yAxis.join(', ')} vs ${xAxis}` },
            xaxis: {
                title: { text: xAxis },
                type: enableLogAxis ? 'log' : 'linear'
            },
            yaxis: {
                title: { text: yAxis.length === 1 ? yAxis[0] : 'Values' },
                type: enableLogAxis ? 'log' : 'linear'
            },
            autosize: true,
            margin: { l: 50, r: 50, b: 50, t: 50 },
            showlegend: yAxis.length > 1
        } as Partial<Layout>,
        hasData: true
    };
};
