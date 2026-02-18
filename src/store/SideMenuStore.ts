import { create } from 'zustand';

export interface SideMenuData {
    xAxis: string;
    yAxis: string;
}

interface SideMenuState {
    sideMenuData: SideMenuData;
    setXAxis: (xAxis: string) => void;
    setYAxis: (yAxis: string) => void;
    loadProject: (xAxis: string, yAxis: string) => void;
}

export const useSideMenuStore = create<SideMenuState>((set) => ({
    sideMenuData: {
        xAxis: '',
        yAxis: ''
    },
    setXAxis: (xAxis) => set((state) => ({
        sideMenuData: { ...state.sideMenuData, xAxis }
    })),
    setYAxis: (yAxis) => set((state) => ({
        sideMenuData: { ...state.sideMenuData, yAxis }
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
