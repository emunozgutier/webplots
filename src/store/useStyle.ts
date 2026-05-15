import { create } from 'zustand';

interface StyleState {
    typeColors: Record<string, string>;
    setTypeColor: (type: string, color: string) => void;
}

export const useStyleStore = create<StyleState>((set) => ({
    typeColors: {
        'Year': '#0d6efd',    // Primary blue
        'Date': '#20c997',    // Teal
        'Time': '#6f42c1',    // Purple
        'Category': '#fd7e14',// Orange
        'Generic': '#6c757d'  // Secondary gray
    },
    setTypeColor: (type, color) => set((state) => ({
        typeColors: { ...state.typeColors, [type]: color }
    }))
}));
