import { create } from 'zustand';

export interface GroupSettings {
    mode: 'auto' | 'manual';
    bins: {
        id: string;
        label: string;
        operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
        value: number;
    }[];
}

export interface AxisSideMenuData {
    plotType: 'scatter' | 'histogram';
    xAxis: string;
    yAxis: string[];
    groupAxis: string | null;
    groupSettings: Record<string, GroupSettings>;
}

interface AxisSideMenuState {
    sideMenuData: AxisSideMenuData;
    setPlotType: (type: 'scatter' | 'histogram') => void;
    setXAxis: (xAxis: string) => void;
    addYAxisColumn: (column: string) => void;
    removeYAxisColumn: (column: string) => void;
    setGroupAxis: (groupAxis: string | null) => void;
    setGroupSettings: (column: string, settings: GroupSettings) => void;
    loadProject: (xAxis: string, yAxis: string[], groupAxis?: string | null, groupSettings?: Record<string, GroupSettings>) => void;
}

export const useAxisSideMenuStore = create<AxisSideMenuState>((set) => ({
    sideMenuData: {
        plotType: 'scatter',
        xAxis: '',
        yAxis: [],
        groupAxis: null,
        groupSettings: {}
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
    setGroupAxis: (groupAxis) => set((state) => ({
        sideMenuData: { ...state.sideMenuData, groupAxis }
    })),
    setGroupSettings: (column, settings) => set((state) => ({
        sideMenuData: {
            ...state.sideMenuData,
            groupSettings: {
                ...state.sideMenuData.groupSettings,
                [column]: settings
            }
        }
    })),
    loadProject: (xAxis, yAxis, groupAxis = null, groupSettings = {}, plotType: 'scatter' | 'histogram' = 'scatter') => set(() => ({
        sideMenuData: { plotType, xAxis, yAxis, groupAxis, groupSettings }
    }))
}));

export const createAxisSideMenuConfig = (columns: string[], sideMenuData: AxisSideMenuData) => {
    return {
        columns,
        plotType: sideMenuData.plotType,
        xAxis: sideMenuData.xAxis,
        yAxis: sideMenuData.yAxis,
        groupAxis: sideMenuData.groupAxis,
        groupSettings: sideMenuData.groupSettings,
        hasColumns: columns.length > 0
    };
};
