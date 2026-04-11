import React, { createContext, useRef, useEffect } from 'react';
import { cloneStoreStates, workspaceRegistry } from './useWorkspaceStore';
import { createAxisSideMenuStore, type AxisSideMenuState } from '../SideMenu/useAxisSideMenuStore';
import { createStyleSideMenuStore, type StyleSideMenuState } from '../SideMenu/useStyleSideMenuStore';
import { createFilterSideMenuStore, type FilterState } from '../SideMenu/useFilterSideMenuStore';
import { createGroupSideMenuStore, type GroupSideMenuState } from '../SideMenu/useGroupSideMenuStore';
import { createInkRatioStore, type InkRatioState } from '../SideMenu/useInkRatioStore';
import { createPlotLayoutStore, type PlotLayoutState } from './usePlotLayoutStore';
import { createTraceConfigStore, type TraceConfigState } from '../SideMenu/useTraceConfigStore';
import { createWorkspaceLocalStore, type WorkspaceLocalState } from './useWorkspaceLocalStore';
import { createSubplotSideMenuStore, type SubplotSideMenuState } from '../SideMenu/useSubplotSideMenuStore';

type StoreApi<T> = import('zustand/vanilla').StoreApi<T>;

export interface WorkspaceStores {
    axisSideMenuStore: StoreApi<AxisSideMenuState>;
    styleSideMenuStore: StoreApi<StyleSideMenuState>;
    filterSideMenuStore: StoreApi<FilterState>;
    groupSideMenuStore: StoreApi<GroupSideMenuState>;
    inkRatioStore: StoreApi<InkRatioState>;
    plotLayoutStore: StoreApi<PlotLayoutState>;
    traceConfigStore: StoreApi<TraceConfigState>;
    workspaceLocalStore: StoreApi<WorkspaceLocalState>;
    subplotSideMenuStore: StoreApi<SubplotSideMenuState>;
}

export const WorkspaceContext = createContext<WorkspaceStores | null>(null);

export const WorkspaceProvider: React.FC<{ workspaceId: string, children: React.ReactNode }> = ({ workspaceId, children }) => {
    const storesRef = useRef<WorkspaceStores | null>(null);

    if (!storesRef.current) {
        storesRef.current = {
            axisSideMenuStore: createAxisSideMenuStore(),
            styleSideMenuStore: createStyleSideMenuStore(),
            filterSideMenuStore: createFilterSideMenuStore(),
            groupSideMenuStore: createGroupSideMenuStore(),
            inkRatioStore: createInkRatioStore(),
            plotLayoutStore: createPlotLayoutStore(),
            traceConfigStore: createTraceConfigStore(),
            workspaceLocalStore: createWorkspaceLocalStore(),
            subplotSideMenuStore: createSubplotSideMenuStore()
        };

        const cloneData = cloneStoreStates.get(workspaceId);
        if (cloneData) {
            storesRef.current.axisSideMenuStore.setState(cloneData.axis);
            storesRef.current.styleSideMenuStore.setState(cloneData.color);
            storesRef.current.filterSideMenuStore.setState(cloneData.filter);
            storesRef.current.groupSideMenuStore.setState(cloneData.group);
            storesRef.current.inkRatioStore.setState(cloneData.ink);
            storesRef.current.plotLayoutStore.setState(cloneData.plot);
            storesRef.current.traceConfigStore.setState(cloneData.trace);
            storesRef.current.subplotSideMenuStore.setState(cloneData.subplot);
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
