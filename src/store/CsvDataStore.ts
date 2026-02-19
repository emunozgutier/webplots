import { create } from 'zustand';

export interface CsvDataStore {
    [key: string]: string | number | null;
}

interface CsvDataState {
    data: CsvDataStore[];
    columns: string[];
    setPlotData: (data: CsvDataStore[]) => void;
    setColumns: (columns: string[]) => void;
    loadProject: (data: CsvDataStore[], columns: string[]) => void;
}

export const useCsvDataStore = create<CsvDataState>((set) => ({
    data: [],
    columns: [],
    setPlotData: (data) => set({ data }),
    setColumns: (columns) => set({ columns }),
    loadProject: (data, columns) => set({ data, columns })
}));
