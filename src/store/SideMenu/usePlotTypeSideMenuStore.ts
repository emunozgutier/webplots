import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from '../Workspace/WorkspaceContext';

export type PlotType = 'scatter' | 'histogram';

export interface PlotTypeSideMenuData {
    plotType: PlotType;
}

export type PlotTypeSideMenuState = {
    plotTypeSideMenuData: PlotTypeSideMenuData;
    setPlotType: (type: PlotType) => void;
    loadProject: (plotType?: PlotType) => void;
};

export const createPlotTypeSideMenuStore = () => createStore<PlotTypeSideMenuState>()(
    (set) => ({
        plotTypeSideMenuData: {
            plotType: 'scatter',
        },
        setPlotType: (plotType) => set((state) => ({
            plotTypeSideMenuData: { ...state.plotTypeSideMenuData, plotType }
        })),
        loadProject: (plotType = 'scatter') => set(() => ({
            plotTypeSideMenuData: { plotType }
        }))
    })
);

export const usePlotTypeSideMenuStore = <T = PlotTypeSideMenuState>(selector: (state: PlotTypeSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('usePlotTypeSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.plotTypeSideMenuStore, selector);
};
