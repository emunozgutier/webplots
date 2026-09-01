import { create } from 'zustand';
import type { SummaryMode } from '../../components/PlotTableAreaComponents/TableAreaComponents/HeaderSummary';

export interface TableState {
    summaryMode: SummaryMode;
    datasetMode: 'all' | 'plot';
    colorMode: 'none' | 'color';
    numberFormat: 'generic' | 'engineering' | 'scientific';
    significantDigits: number;
    alignDecimal: boolean;
    gaussianConfidenceThreshold: number;
    gaussianMaxComponents: number;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    
    // Actions
    setSummaryMode: (mode: SummaryMode) => void;
    setDatasetMode: (mode: 'all' | 'plot') => void;
    setColorMode: (mode: 'none' | 'color') => void;
    setNumberFormat: (format: 'generic' | 'engineering' | 'scientific') => void;
    setSignificantDigits: (digits: number) => void;
    setAlignDecimal: (align: boolean) => void;
    setGaussianConfidenceThreshold: (threshold: number) => void;
    setGaussianMaxComponents: (count: number) => void;
    setSortConfig: (config: { key: string; direction: 'asc' | 'desc' } | null) => void;
}


export const useTableStore = create<TableState>()(
        (set) => ({
            summaryMode: 'detailed',
            datasetMode: 'all',
            colorMode: 'color',
            numberFormat: 'engineering',
            significantDigits: 4,
            alignDecimal: true,
            gaussianConfidenceThreshold: 60,
            gaussianMaxComponents: 4,
            sortConfig: null,

            setSummaryMode: (summaryMode) => set({ summaryMode }),
            setDatasetMode: (datasetMode) => set({ datasetMode }),
            setColorMode: (colorMode) => set({ colorMode }),
            setNumberFormat: (numberFormat) => set({ numberFormat }),
            setSignificantDigits: (significantDigits) => set({ significantDigits }),
            setAlignDecimal: (alignDecimal) => set({ alignDecimal }),
            setGaussianConfidenceThreshold: (gaussianConfidenceThreshold) => set({ gaussianConfidenceThreshold }),
            setGaussianMaxComponents: (gaussianMaxComponents) => set({ gaussianMaxComponents }),
            setSortConfig: (sortConfig) => set({ sortConfig })
        })
    );

