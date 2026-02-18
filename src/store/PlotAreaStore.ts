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
    const hasData = data.length > 0 && !!xAxis && !!yAxis;

    if (!hasData) {
        return {
            plotData: [] as Data[],
            layout: {},
            hasData: false
        };
    }

    const x = data.map(row => row[xAxis]);
    const y = data.map(row => row[yAxis]);

    return {
        plotData: [{
            x: x,
            y: y,
            mode: 'lines',
            type: 'scatter'
        }] as Data[],
        layout: {
            width: undefined,
            height: undefined,
            title: { text: plotTitle || `Plot: ${yAxis} vs ${xAxis}` },
            xaxis: {
                title: { text: xAxis },
                type: enableLogAxis ? 'log' : 'linear'
            },
            yaxis: {
                title: { text: yAxis },
                type: enableLogAxis ? 'log' : 'linear'
            },
            autosize: true,
            margin: { l: 50, r: 50, b: 50, t: 50 }
        } as Partial<Layout>,
        hasData: true
    };
};
