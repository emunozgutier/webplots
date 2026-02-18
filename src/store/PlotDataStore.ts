import { create } from 'zustand';

export interface PlotData {
    [key: string]: string | number;
}

interface PlotDataState {
    data: PlotData[];
    columns: string[];
    setPlotData: (data: PlotData[]) => void;
    setColumns: (columns: string[]) => void;
    loadProject: (data: PlotData[], columns: string[]) => void;
}

export const usePlotDataStore = create<PlotDataState>((set) => ({
    data: [],
    columns: [],
    setPlotData: (data) => set({ data }),
    setColumns: (columns) => set({ columns }),
    loadProject: (data, columns) => set({ data, columns })
}));
