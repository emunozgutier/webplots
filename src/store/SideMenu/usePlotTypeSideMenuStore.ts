import { create } from 'zustand';

export type PlotType = 'scatter' | 'histogram';

export interface PlotTypeSideMenuData {
    plotType: PlotType;
}

export type PlotTypeSideMenuState = {
    plotTypeSideMenuData: PlotTypeSideMenuData;
    setPlotType: (type: PlotType) => void;
    loadProject: (plotType?: PlotType) => void;
};

export const usePlotTypeSideMenuStore = create<PlotTypeSideMenuState>()(
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

