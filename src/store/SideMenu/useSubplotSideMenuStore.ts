import { create } from 'zustand';

export type SubplotSideMenuState = {
    isAutoSortEnabled: boolean;
    syncXAxis: boolean;
    syncYAxis: boolean;
    rows: number;
    cols: number;
    traceToSubplots: Record<string, number[]>; // maps trace name to an array of 1-based subplot indices
    setIsAutoSortEnabled: (enabled: boolean) => void;
    setSyncXAxis: (sync: boolean) => void;
    setSyncYAxis: (sync: boolean) => void;
    setGrid: (rows: number, cols: number) => void;
    assignTraceToSubplot: (traceName: string, subplotIndex: number, isAssigned: boolean) => void;
    setAllTraceSubplots: (mapping: Record<string, number[]>) => void;
};

export const useSubplotSideMenuStore = create<SubplotSideMenuState>()(
    (set) => ({
        isAutoSortEnabled: true,
        syncXAxis: false,
        syncYAxis: false,
        rows: 1,
        cols: 1,
        traceToSubplots: {},
        setIsAutoSortEnabled: (enabled) => set({ isAutoSortEnabled: enabled }),
        setSyncXAxis: (sync) => set({ syncXAxis: sync }),
        setSyncYAxis: (sync) => set({ syncYAxis: sync }),
        setGrid: (rows, cols) => set({ rows, cols }),
        setAllTraceSubplots: (mapping) => set((state) => ({
            traceToSubplots: {
                ...state.traceToSubplots,
                ...mapping
            }
        })),
        assignTraceToSubplot: (traceName, subplotIndex, isAssigned) => set((state) => {
            const currentSubplots = state.traceToSubplots[traceName] === undefined ? [1] : state.traceToSubplots[traceName];
            let newSubplots;
            if (isAssigned) {
                if (!currentSubplots.includes(subplotIndex)) {
                    newSubplots = [...currentSubplots, subplotIndex].sort((a, b) => a - b);
                } else {
                    newSubplots = currentSubplots;
                }
            } else {
                newSubplots = currentSubplots.filter(id => id !== subplotIndex);
            }
            return {
                traceToSubplots: {
                    ...state.traceToSubplots,
                    [traceName]: newSubplots,
                }
            };
        }),
    })
);

