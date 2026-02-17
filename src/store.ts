
import { create } from 'zustand';
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
    }))
}));
