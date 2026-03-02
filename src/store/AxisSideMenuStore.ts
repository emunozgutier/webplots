import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export interface AxisSideMenuData {
    plotType: 'scatter' | 'histogram';
    xAxis: string;
    yAxis: string[];
}

export type AxisSideMenuState = {
    sideMenuData: AxisSideMenuData;
    setPlotType: (type: 'scatter' | 'histogram') => void;
    setXAxis: (xAxis: string) => void;
    addYAxisColumn: (column: string) => void;
    removeYAxisColumn: (column: string) => void;
    loadProject: (xAxis: string, yAxis: string[], plotType?: 'scatter' | 'histogram') => void;
}

export const createAxisSideMenuStore = () => createStore<AxisSideMenuState>()((set) => ({
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

export const useAxisSideMenuStore = <T = AxisSideMenuState>(selector: (state: AxisSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useAxisSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.axisSideMenuStore, selector);
};
