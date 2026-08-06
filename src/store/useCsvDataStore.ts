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

export const useCsvDataStore = create<CsvDataState>()(
    (set) => ({
        data: [],
        columns: [],
        setPlotData: (data) => set({ 
            data: data.map((r, i) => ({ ...r, __idx: i + 1 })) 
        }),
        setColumns: (columns) => set({ columns }),
        loadProject: (data, columns) => set({ 
            data: data.map((r, i) => ({ ...r, __idx: i + 1 })), 
            columns 
        })
    })
);

if (typeof window !== 'undefined') {
    const win = window as unknown as { __registerZustandStore?: (store: unknown, name: string) => void };
    if (win.__registerZustandStore) {
        win.__registerZustandStore(useCsvDataStore, 'CsvDataStore');
    }
}
