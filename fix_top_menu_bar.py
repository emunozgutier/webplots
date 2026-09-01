import re

def process(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    content = re.sub(r"const activeStores = workspaceRegistry.get.*?;\n?", "", content)
    
    # Imports
    imports = """
import { useAxisSideMenuStore } from '../store/SideMenu/useAxisSideMenuStore';
import { usePlotTypeSideMenuStore } from '../store/SideMenu/usePlotTypeSideMenuStore';
import { useStyleSideMenuStore } from '../store/SideMenu/useStyleSideMenuStore';
import { useFilterSideMenuStore } from '../store/SideMenu/useFilterSideMenuStore';
import { useGroupSideMenuStore } from '../store/SideMenu/useGroupSideMenuStore';
import { useInkRatioStore } from '../store/SideMenu/useInkRatioStore';
import { usePlotLayoutStore } from '../store/PlotTable/usePlotLayoutStore';
import { useTraceConfigStore } from '../store/PlotTable/useTraceConfigStore';
import { useSubplotSideMenuStore } from '../store/SideMenu/useSubplotSideMenuStore';
import { useTableStore } from '../store/PlotTable/useTableStore';
import { useAnimationSideMenuStore } from '../store/SideMenu/useAnimationSideMenuStore';
import { useAnnotationSideMenuStore } from '../store/SideMenu/useAnnotationSideMenuStore';
import { useAppLocalStore } from '../store/useAppLocalStore';
"""
    if "useAxisSideMenuStore" not in content:
        content = content.replace("import { useWorkspaceStore } from '../store/Workspace/useWorkspaceStore';", "import { useWorkspaceStore } from '../store/Workspace/useWorkspaceStore';\n" + imports)

    content = content.replace("activeStores.axisSideMenuStore.getState()", "useAxisSideMenuStore.getState()")
    content = content.replace("activeStores.plotTypeSideMenuStore.getState()", "usePlotTypeSideMenuStore.getState()")
    content = content.replace("activeStores.styleSideMenuStore.getState()", "useStyleSideMenuStore.getState()")
    content = content.replace("activeStores.filterSideMenuStore.getState()", "useFilterSideMenuStore.getState()")
    content = content.replace("activeStores.groupSideMenuStore.getState()", "useGroupSideMenuStore.getState()")
    content = content.replace("activeStores.inkRatioStore.getState()", "useInkRatioStore.getState()")
    content = content.replace("activeStores.plotLayoutStore.getState()", "usePlotLayoutStore.getState()")
    content = content.replace("activeStores.traceConfigStore.getState()", "useTraceConfigStore.getState()")
    content = content.replace("activeStores.subplotSideMenuStore.getState()", "useSubplotSideMenuStore.getState()")
    content = content.replace("activeStores.tableStore.getState()", "useTableStore.getState()")
    content = content.replace("activeStores.animationSideMenuStore.getState()", "useAnimationSideMenuStore.getState()")
    content = content.replace("activeStores.annotationSideMenuStore.getState()", "useAnnotationSideMenuStore.getState()")

    # Remove activeWorkspaceId destructing from useWorkspaceStore
    content = re.sub(r"const { isTopMenuBarOpen.*? activeWorkspaceId } = useWorkspaceStore\(\);", "const { isTopMenuBarOpen } = useWorkspaceStore();", content)

    # In useDemoData.ts
    content = content.replace("import { useWorkspaceStore } from './Workspace/useWorkspaceStore';", "import { useWorkspaceStore } from './Workspace/useWorkspaceStore';\n" + imports)
    
    with open(filepath, 'w') as f:
        f.write(content)

process('src/components/TopMenuBar.tsx')
process('src/store/useDemoData.ts')
