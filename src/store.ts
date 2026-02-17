import { create } from 'zustand';
import type { Layout, Data } from 'plotly.js';
import type { PlotArea, PlotData } from './DataStructure';

interface AppState {
    data: PlotData[];
    columns: string[];
    plotArea: PlotArea;

    // Actions
    setPlotData: (data: PlotData[]) => void;
    setColumns: (columns: string[]) => void;
    setXAxis: (xAxis: string) => void;
    setYAxis: (yAxis: string) => void;
    setEnableLogAxis: (enable: boolean) => void;
    setPlotTitle: (title: string) => void;
    loadProject: (state: Partial<AppState>) => void;
}

export const useAppStore = create<AppState>((set) => ({
    data: [],
    columns: [],
    plotArea: {
        enableLogAxis: false,
        plotTitle: '',
        axisMenuData: {
            xAxis: '',
            yAxis: ''
        }
    },

    setPlotData: (data) => set({ data }),
    setColumns: (columns) => set({ columns }),

    setXAxis: (xAxis) => set((state) => ({
        plotArea: {
            ...state.plotArea,
            axisMenuData: {
                ...state.plotArea.axisMenuData,
                xAxis
            }
        }
    })),

    setYAxis: (yAxis) => set((state) => ({
        plotArea: {
            ...state.plotArea,
            axisMenuData: {
                ...state.plotArea.axisMenuData,
                yAxis
            }
        }
    })),

    setEnableLogAxis: (enableLogAxis) => set((state) => ({
        plotArea: {
            ...state.plotArea,
            enableLogAxis
        }
    })),

    setPlotTitle: (plotTitle) => set((state) => ({
        plotArea: {
            ...state.plotArea,
            plotTitle
        }
    })),

    loadProject: (state) => set(state)
}));

export const createPlotConfig = (data: PlotData[], plotArea: PlotArea) => {
    const { xAxis, yAxis } = plotArea.axisMenuData;
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
            title: { text: `Plot: ${yAxis} vs ${xAxis}` },
            xaxis: { title: { text: xAxis } },
            yaxis: { title: { text: yAxis } },
            autosize: true,
            margin: { l: 50, r: 50, b: 50, t: 50 }
        } as Partial<Layout>,
        hasData: true
    };
};

export const createSideMenuConfig = (columns: string[], plotArea: PlotArea) => {
    return {
        columns,
        xAxis: plotArea.axisMenuData.xAxis,
        yAxis: plotArea.axisMenuData.yAxis,
        hasColumns: columns.length > 0
    };
};
