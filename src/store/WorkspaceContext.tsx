import React, { createContext, useRef, useEffect } from 'react';
import { cloneStoreStates, workspaceRegistry } from './WorkspaceStore';
import { createAxisSideMenuStore, type AxisSideMenuState } from './AxisSideMenuStore';
import { createColorSideMenuStore, type ColorSideMenuState } from './ColorSideMenuStore';
import { createFilterSideMenuStore, type FilterState } from './FilterSideMenuStore';
import { createGroupSideMenuStore, type GroupSideMenuState } from './GroupSideMenuStore';
import { createInkRatioStore, type InkRatioState } from './InkRatioStore';
import { createPlotLayoutStore, type PlotLayoutState } from './PlotLayoutStore';
import { createTraceConfigStore, type TraceConfigState } from './TraceConfigStore';
import { createWorkspaceLocalStore, type WorkspaceLocalState } from './WorkspaceLocalStore';

type StoreApi<T> = import('zustand/vanilla').StoreApi<T>;

export interface WorkspaceStores {
    axisSideMenuStore: StoreApi<AxisSideMenuState>;
    colorSideMenuStore: StoreApi<ColorSideMenuState>;
    filterSideMenuStore: StoreApi<FilterState>;
    groupSideMenuStore: StoreApi<GroupSideMenuState>;
    inkRatioStore: StoreApi<InkRatioState>;
    plotLayoutStore: StoreApi<PlotLayoutState>;
    traceConfigStore: StoreApi<TraceConfigState>;
    workspaceLocalStore: StoreApi<WorkspaceLocalState>;
}

export const WorkspaceContext = createContext<WorkspaceStores | null>(null);

export const WorkspaceProvider: React.FC<{ workspaceId: string, children: React.ReactNode }> = ({ workspaceId, children }) => {
    const storesRef = useRef<WorkspaceStores | null>(null);

    if (!storesRef.current) {
        storesRef.current = {
            axisSideMenuStore: createAxisSideMenuStore(workspaceId),
            colorSideMenuStore: createColorSideMenuStore(workspaceId),
            filterSideMenuStore: createFilterSideMenuStore(workspaceId),
            groupSideMenuStore: createGroupSideMenuStore(workspaceId),
            inkRatioStore: createInkRatioStore(workspaceId),
            plotLayoutStore: createPlotLayoutStore(workspaceId),
            traceConfigStore: createTraceConfigStore(workspaceId),
            workspaceLocalStore: createWorkspaceLocalStore(workspaceId)
        };

        const cloneData = cloneStoreStates.get(workspaceId);
        if (cloneData) {
            storesRef.current.axisSideMenuStore.setState(cloneData.axis);
            storesRef.current.colorSideMenuStore.setState(cloneData.color);
            storesRef.current.filterSideMenuStore.setState(cloneData.filter);
            storesRef.current.groupSideMenuStore.setState(cloneData.group);
            storesRef.current.inkRatioStore.setState(cloneData.ink);
            storesRef.current.plotLayoutStore.setState(cloneData.plot);
            storesRef.current.traceConfigStore.setState(cloneData.trace);
            cloneStoreStates.delete(workspaceId);
        }

        workspaceRegistry.set(workspaceId, storesRef.current);
    }

    useEffect(() => {
        return () => {
            workspaceRegistry.delete(workspaceId);
        };
    }, [workspaceId]);

    return (
        <WorkspaceContext.Provider value={storesRef.current}>
            {children}
        </WorkspaceContext.Provider>
    );
};
