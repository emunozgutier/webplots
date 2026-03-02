import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export type FilterType = 'number' | 'category';

export interface FilterConfig {
    [key: string]: any;
}

export interface NumberFilterConfig extends FilterConfig {
    min?: number;
    max?: number;
}

export interface CategoryFilterConfig extends FilterConfig {
    includedValues: string[];
}

export interface Filter {
    id: string;
    column: string;
    type: FilterType;
    config: NumberFilterConfig | CategoryFilterConfig;
}

export type FilterState = {
    filters: Filter[];
    addFilter: (column: string, type: FilterType, initialConfig?: FilterConfig) => void;
    removeFilter: (id: string) => void;
    updateFilter: (id: string, config: FilterConfig) => void;
    reorderFilters: (startIndex: number, endIndex: number) => void;
    clearFilters: () => void;
}

export const createFilterSideMenuStore = () => createStore<FilterState>()((set) => ({
    filters: [],
    addFilter: (column, type, initialConfig) => set((state) => {
        const newFilter: Filter = {
            id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            column,
            type,
            config: initialConfig || (type === 'category' ? { includedValues: [] } : {})
        };
        return { filters: [...state.filters, newFilter] };
    }),
    removeFilter: (id) => set((state) => ({
        filters: state.filters.filter(f => f.id !== id)
    })),
    updateFilter: (id, config) => set((state) => ({
        filters: state.filters.map(f =>
            f.id === id ? { ...f, config: { ...f.config, ...config } } : f
        )
    })),
    reorderFilters: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.filters);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { filters: result };
    }),
    clearFilters: () => set({ filters: [] })
}));

export const useFilterSideMenuStore = <T = FilterState>(selector: (state: FilterState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useFilterSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.filterSideMenuStore, selector);
};
