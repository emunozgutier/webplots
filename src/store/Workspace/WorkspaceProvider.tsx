import React, { useRef, useEffect } from 'react';
import { WorkspaceContext, type WorkspaceStores } from './WorkspaceContext';
import { cloneStoreStates, workspaceRegistry } from './useWorkspaceStore';

// Factory imports (these are what caused the circular dependency when in WorkspaceContext)
import { createAxisSideMenuStore } from '../SideMenu/useAxisSideMenuStore';
import { createStyleSideMenuStore } from '../SideMenu/useStyleSideMenuStore';
import { createFilterSideMenuStore } from '../SideMenu/useFilterSideMenuStore';
import { createGroupSideMenuStore } from '../SideMenu/useGroupSideMenuStore';
import { createInkRatioStore } from '../SideMenu/useInkRatioStore';
import { createPlotLayoutStore } from '../PlotTable/usePlotLayoutStore';
import { createTraceConfigStore } from '../PlotTable/useTraceConfigStore';
import { createWorkspaceLocalStore } from './useWorkspaceLocalStore';
import { createSubplotSideMenuStore } from '../SideMenu/useSubplotSideMenuStore';
import { createTableStore } from '../PlotTable/useTableStore';
import { createAnimationSideMenuStore } from '../SideMenu/useAnimationSideMenuStore';
import { createAnnotationSideMenuStore } from '../SideMenu/useAnnotationSideMenuStore';
import { createPlotTypeSideMenuStore } from '../SideMenu/usePlotTypeSideMenuStore';

export const WorkspaceProvider: React.FC<{ workspaceId: string, children: React.ReactNode }> = ({ workspaceId, children }) => {
    const storesRef = useRef<WorkspaceStores | null>(null);

    if (!storesRef.current) {
        storesRef.current = {
            axisSideMenuStore: createAxisSideMenuStore(),
            plotTypeSideMenuStore: createPlotTypeSideMenuStore(),
            styleSideMenuStore: createStyleSideMenuStore(),
            filterSideMenuStore: createFilterSideMenuStore(),
            groupSideMenuStore: createGroupSideMenuStore(),
            inkRatioStore: createInkRatioStore(),
            plotLayoutStore: createPlotLayoutStore(),
            traceConfigStore: createTraceConfigStore(),
            workspaceLocalStore: createWorkspaceLocalStore(),
            subplotSideMenuStore: createSubplotSideMenuStore(),
            tableStore: createTableStore(),
            animationSideMenuStore: createAnimationSideMenuStore(),
            annotationSideMenuStore: createAnnotationSideMenuStore()
        };

        const cloneData = cloneStoreStates.get(workspaceId);
        if (cloneData) {
            storesRef.current.axisSideMenuStore.setState(cloneData.axis);
            if (cloneData.plotType) storesRef.current.plotTypeSideMenuStore.setState(cloneData.plotType);
            storesRef.current.styleSideMenuStore.setState(cloneData.color);
            storesRef.current.filterSideMenuStore.setState(cloneData.filter);
            storesRef.current.groupSideMenuStore.setState(cloneData.group);
            storesRef.current.inkRatioStore.setState(cloneData.ink);
            storesRef.current.plotLayoutStore.setState(cloneData.plot);
            storesRef.current.traceConfigStore.setState(cloneData.trace);
            storesRef.current.subplotSideMenuStore.setState(cloneData.subplot);
            if (cloneData.table) storesRef.current.tableStore.setState(cloneData.table);
            if (cloneData.animation) storesRef.current.animationSideMenuStore.setState(cloneData.animation);
            if (cloneData.annotation) storesRef.current.annotationSideMenuStore.setState(cloneData.annotation);
            cloneStoreStates.delete(workspaceId);
        }

        workspaceRegistry.set(workspaceId, storesRef.current);
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && storesRef.current) {
            const win = window as unknown as { __registerZustandStore?: (store: unknown, name: string) => void };
            if (win.__registerZustandStore) {
                const stores = storesRef.current;
                Object.entries(stores).forEach(([key, store]) => {
                    win.__registerZustandStore!(store, `${workspaceId}_${key}`);
                });
            }
        }
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
