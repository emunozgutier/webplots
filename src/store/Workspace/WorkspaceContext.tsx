import { createContext } from 'react';

// Use import type to avoid circular dependencies at runtime
import type { AxisSideMenuState } from '../SideMenu/useAxisSideMenuStore';
import type { StyleSideMenuState } from '../SideMenu/useStyleSideMenuStore';
import type { FilterState } from '../SideMenu/useFilterSideMenuStore';
import type { GroupSideMenuState } from '../SideMenu/useGroupSideMenuStore';
import type { InkRatioState } from '../SideMenu/useInkRatioStore';
import type { PlotLayoutState } from '../PlotTable/usePlotLayoutStore';
import type { TraceConfigState } from '../PlotTable/useTraceConfigStore';
import type { WorkspaceLocalState } from './useWorkspaceLocalStore';
import type { SubplotSideMenuState } from '../SideMenu/useSubplotSideMenuStore';
import type { TableState } from '../PlotTable/useTableStore';
import type { AnimationSideMenuState } from '../SideMenu/useAnimationSideMenuStore';

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
    tableStore: StoreApi<TableState>;
    animationSideMenuStore: StoreApi<AnimationSideMenuState>;
}

export const WorkspaceContext = createContext<WorkspaceStores | null>(null);
