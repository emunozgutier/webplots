import { create } from 'zustand';

export type SubplotSideMenuState = {
    isAutoSortEnabled: boolean;
    rows: number;
    cols: number;
    traceToSubplots: Record<string, number[]>; // maps trace name to an array of 1-based subplot indices
    setIsAutoSortEnabled: (enabled: boolean) => void;
    setGrid: (rows: number, cols: number) => void;
    assignTraceToSubplot: (traceName: string, subplotIndex: number, isAssigned: boolean) => void;
    setAllTraceSubplots: (mapping: Record<string, number[]>) => void;
};

export const useSubplotSideMenuStore = create<SubplotSideMenuState>()(
    (set) => ({
        isAutoSortEnabled: true,
        rows: 1,
        cols: 1,
        traceToSubplots: {},
        setIsAutoSortEnabled: (enabled) => set({ isAutoSortEnabled: enabled }),
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

