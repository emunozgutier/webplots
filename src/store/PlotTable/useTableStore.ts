import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from '../Workspace/WorkspaceContext';
import type { SummaryMode } from '../../components/PlotTableAreaComponents/TableAreaComponents/HeaderSummary';

export interface TableState {
    summaryMode: SummaryMode;
    datasetMode: 'all' | 'plot';
    colorMode: 'none' | 'color';
    numberFormat: 'generic' | 'engineering' | 'scientific';
    significantDigits: number;
    alignDecimal: boolean;
    gaussianConfidenceThreshold: number;
    
    // Actions
    setSummaryMode: (mode: SummaryMode) => void;
    setDatasetMode: (mode: 'all' | 'plot') => void;
    setColorMode: (mode: 'none' | 'color') => void;
    setNumberFormat: (format: 'generic' | 'engineering' | 'scientific') => void;
    setSignificantDigits: (digits: number) => void;
    setAlignDecimal: (align: boolean) => void;
    setGaussianConfidenceThreshold: (threshold: number) => void;
}

export const createTableStore = () => {
    return createStore<TableState>()(
        (set) => ({
            summaryMode: 'detailed',
            datasetMode: 'all',
            colorMode: 'color',
            numberFormat: 'engineering',
            significantDigits: 4,
            alignDecimal: true,
            gaussianConfidenceThreshold: 60,

            setSummaryMode: (summaryMode) => set({ summaryMode }),
            setDatasetMode: (datasetMode) => set({ datasetMode }),
            setColorMode: (colorMode) => set({ colorMode }),
            setNumberFormat: (numberFormat) => set({ numberFormat }),
            setSignificantDigits: (significantDigits) => set({ significantDigits }),
            setAlignDecimal: (alignDecimal) => set({ alignDecimal }),
            setGaussianConfidenceThreshold: (gaussianConfidenceThreshold) => set({ gaussianConfidenceThreshold })
        })
    );
};

export const useTableStore = <T = TableState>(selector: (state: TableState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useTableStore must be used within WorkspaceProvider');
    return useStore(context.tableStore, selector);
};
