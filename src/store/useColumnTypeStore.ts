import { create } from 'zustand';

interface ColumnTypeState {
    overrides: Record<string, string>;
    setOverride: (column: string, type: string) => void;
    clearOverrides: () => void;
}

export const useColumnTypeStore = create<ColumnTypeState>((set) => ({
    overrides: {},
    setOverride: (column, type) => set((state) => ({
        overrides: { ...state.overrides, [column]: type }
    })),
    clearOverrides: () => set({ overrides: {} })
}));
