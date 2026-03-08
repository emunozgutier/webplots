import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export type SubplotSideMenuState = {
    rows: number;
    cols: number;
    traceToSubplots: Record<string, number[]>; // maps trace name to an array of 1-based subplot indices
    setGrid: (rows: number, cols: number) => void;
    assignTraceToSubplot: (traceName: string, subplotIndex: number, isAssigned: boolean) => void;
};

export const createSubplotSideMenuStore = () => createStore<SubplotSideMenuState>()(
    (set) => ({
        rows: 1,
        cols: 1,
        traceToSubplots: {},
        setGrid: (rows, cols) => set({ rows, cols }),
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

export const useSubplotSideMenuStore = <T = SubplotSideMenuState>(selector: (state: SubplotSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useSubplotSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.subplotSideMenuStore, selector);
};
