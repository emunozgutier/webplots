import { create } from 'zustand';

export interface AxisSideMenuData {
    plotType: 'scatter' | 'histogram';
    xAxis: string;
    yAxis: string[];
}

interface AxisSideMenuState {
    sideMenuData: AxisSideMenuData;
    setPlotType: (type: 'scatter' | 'histogram') => void;
    setXAxis: (xAxis: string) => void;
    addYAxisColumn: (column: string) => void;
    removeYAxisColumn: (column: string) => void;
    loadProject: (xAxis: string, yAxis: string[], plotType?: 'scatter' | 'histogram') => void;
}

export const useAxisSideMenuStore = create<AxisSideMenuState>((set) => ({
    sideMenuData: {
        plotType: 'scatter',
        xAxis: '',
        yAxis: []
    },
    setPlotType: (plotType) => set((state) => ({
        sideMenuData: { ...state.sideMenuData, plotType }
    })),
    setXAxis: (xAxis) => set((state) => ({
        sideMenuData: { ...state.sideMenuData, xAxis }
    })),
    addYAxisColumn: (column) => set((state) => {
        if (state.sideMenuData.yAxis.includes(column)) return state;
        if (state.sideMenuData.yAxis.length >= 8) return state;
        return {
            sideMenuData: {
                ...state.sideMenuData,
                yAxis: [...state.sideMenuData.yAxis, column]
            }
        };
    }),
    removeYAxisColumn: (column) => set((state) => ({
        sideMenuData: {
            ...state.sideMenuData,
            yAxis: state.sideMenuData.yAxis.filter(c => c !== column)
        }
    })),
    loadProject: (xAxis, yAxis, plotType: 'scatter' | 'histogram' = 'scatter') => set(() => ({
        sideMenuData: { plotType, xAxis, yAxis }
    }))
}));

export const createAxisSideMenuConfig = (columns: string[], sideMenuData: AxisSideMenuData) => {
    return {
        columns,
        plotType: sideMenuData.plotType,
        xAxis: sideMenuData.xAxis,
        yAxis: sideMenuData.yAxis,
        hasColumns: columns.length > 0
    };
};
