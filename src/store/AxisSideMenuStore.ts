import { create } from 'zustand';

export interface AxisSideMenuData {
    xAxis: string;
    yAxis: string[];
    groupAxis: string | null;
}

interface AxisSideMenuState {
    sideMenuData: AxisSideMenuData;
    setXAxis: (xAxis: string) => void;
    addYAxisColumn: (column: string) => void;
    removeYAxisColumn: (column: string) => void;
    setGroupAxis: (groupAxis: string | null) => void;
    loadProject: (xAxis: string, yAxis: string[], groupAxis?: string | null) => void;
}

export const useAxisSideMenuStore = create<AxisSideMenuState>((set) => ({
    sideMenuData: {
        xAxis: '',
        yAxis: [],
        groupAxis: null
    },
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
    loadProject: (xAxis, yAxis, groupAxis = null) => set(() => ({
        sideMenuData: { xAxis, yAxis, groupAxis }
    }))
}));

export const createAxisSideMenuConfig = (columns: string[], sideMenuData: AxisSideMenuData) => {
    return {
        columns,
        xAxis: sideMenuData.xAxis,
        yAxis: sideMenuData.yAxis,
        groupAxis: sideMenuData.groupAxis,
        hasColumns: columns.length > 0
    };
};
