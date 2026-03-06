import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { idbStorage } from '../utils/idbStorage';

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

export const useCsvDataStore = create<CsvDataState>()(
    persist(
        (set) => ({
            data: [],
            columns: [],
            setPlotData: (data) => set({ data }),
            setColumns: (columns) => set({ columns }),
            loadProject: (data, columns) => set({ data, columns })
        }),
        {
            name: 'webplots-csv-storage', // unique name
            storage: createJSONStorage(() => idbStorage),
        }
    )
);
