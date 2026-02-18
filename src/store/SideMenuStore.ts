import { create } from 'zustand';

export interface SideMenuData {
    xAxis: string;
    yAxis: string[];
}

interface SideMenuState {
    sideMenuData: SideMenuData;
    setXAxis: (xAxis: string) => void;
    addYAxisColumn: (column: string) => void;
    removeYAxisColumn: (column: string) => void;
    loadProject: (xAxis: string, yAxis: string[]) => void;
}

export const useSideMenuStore = create<SideMenuState>((set) => ({
    sideMenuData: {
        xAxis: '',
        yAxis: []
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
    loadProject: (xAxis, yAxis) => set(() => ({
        sideMenuData: { xAxis, yAxis }
    }))
}));

export const createSideMenuConfig = (columns: string[], sideMenuData: SideMenuData) => {
    return {
        columns,
        xAxis: sideMenuData.xAxis,
        yAxis: sideMenuData.yAxis,
        hasColumns: columns.length > 0
    };
};
