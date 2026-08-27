import type { WorkspaceStores } from '../store/Workspace/WorkspaceContext';
import { useWorkspaceStore, workspaceRegistry } from '../store/Workspace/useWorkspaceStore';
import { createAxisSideMenuStore } from '../store/SideMenu/useAxisSideMenuStore';
import { createPlotTypeSideMenuStore } from '../store/SideMenu/usePlotTypeSideMenuStore';
import { createStyleSideMenuStore } from '../store/SideMenu/useStyleSideMenuStore';
import { createFilterSideMenuStore } from '../store/SideMenu/useFilterSideMenuStore';
import { createGroupSideMenuStore } from '../store/SideMenu/useGroupSideMenuStore';
import { createInkRatioStore } from '../store/SideMenu/useInkRatioStore';
import { createPlotLayoutStore } from '../store/PlotTable/usePlotLayoutStore';
import { createTraceConfigStore } from '../store/PlotTable/useTraceConfigStore';
import { createSubplotSideMenuStore } from '../store/SideMenu/useSubplotSideMenuStore';
import { createTableStore } from '../store/PlotTable/useTableStore';
import { createAnimationSideMenuStore } from '../store/SideMenu/useAnimationSideMenuStore';
import { createAnnotationSideMenuStore } from '../store/SideMenu/useAnnotationSideMenuStore';

/**
 * Completely resets all side menu, plot layout, filter, group, trace, subplot, animation, and annotation stores
 * in the given workspace to their fresh initial state.
 */
export const resetWorkspaceStores = (stores: WorkspaceStores) => {
    stores.axisSideMenuStore.setState(createAxisSideMenuStore().getState());
    stores.plotTypeSideMenuStore.setState(createPlotTypeSideMenuStore().getState());
    stores.filterSideMenuStore.setState(createFilterSideMenuStore().getState());
    stores.groupSideMenuStore.setState(createGroupSideMenuStore().getState());
    stores.subplotSideMenuStore.setState(createSubplotSideMenuStore().getState());
    stores.styleSideMenuStore.setState(createStyleSideMenuStore().getState());
    stores.inkRatioStore.setState(createInkRatioStore().getState());
    stores.plotLayoutStore.setState(createPlotLayoutStore().getState());
    stores.traceConfigStore.setState(createTraceConfigStore().getState());
    stores.animationSideMenuStore.setState(createAnimationSideMenuStore().getState());
    stores.annotationSideMenuStore.setState(createAnnotationSideMenuStore().getState());
    stores.tableStore.setState(createTableStore().getState());
};

/**
 * Resets the currently active workspace stores if found in registry.
 */
export const resetActiveWorkspace = () => {
    const activeWorkspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    const activeStores = workspaceRegistry.get(activeWorkspaceId);
    if (activeStores) {
        resetWorkspaceStores(activeStores);
    }
};
