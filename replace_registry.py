import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove workspaceRegistry imports
    content = re.sub(r", workspaceRegistry", "", content)
    content = re.sub(r"workspaceRegistry, ", "", content)

    # In TopMenuBar.tsx
    content = re.sub(r"const activeStores = workspaceRegistry.get\(activeWorkspaceId\);\n\s+if \(!activeStores\) return;", "", content)
    content = re.sub(r"const activeStores = workspaceRegistry.get\(useWorkspaceStore.getState\(\).activeWorkspaceId\);\n\s+if \(activeStores\) activeStores.axisSideMenuStore.getState\(\).setXAxis", "useAxisSideMenuStore.getState().setXAxis", content)
    
    # In useDemoData.ts
    content = re.sub(r"const activeStores = workspaceRegistry.get\(useWorkspaceStore.getState\(\).activeWorkspaceId\);\n\s+if \(activeStores\) \{", "if (true) {", content)
    content = re.sub(r"activeStores.axisSideMenuStore.getState\(\).setXAxis", "useAxisSideMenuStore.getState().setXAxis", content)

    # Note: TutorialGDP.tsx needs careful replacement
    content = re.sub(r"const stores = workspaceRegistry.get\(activeWorkspaceId\);\n\s+if \(!stores\) return;", "", content)
    content = re.sub(r"const stores = workspaceRegistry.get\(activeWorkspaceId\);\n\s+if \(stores\) \{", "if (true) {", content)
    content = re.sub(r"stores.axisSideMenuStore.getState\(\)", "useAxisSideMenuStore.getState()", content)
    content = re.sub(r"stores.animationSideMenuStore.getState\(\)", "useAnimationSideMenuStore.getState()", content)
    content = re.sub(r"stores.plotTypeSideMenuStore.getState\(\)", "usePlotTypeSideMenuStore.getState()", content)
    content = re.sub(r"stores.traceConfigStore.getState\(\)", "useTraceConfigStore.getState()", content)

    # Specific replacements for saving/loading projects in TopMenuBar
    # "activeStores" -> we just import all the stores directly in TopMenuBar
    
    with open(filepath, 'w') as f:
        f.write(content)

for f in ['src/components/TopMenuBar.tsx', 'src/store/useDemoData.ts', 'src/components/InkyHelper/tutorialGDP/TutorialGDP.tsx']:
    process_file(f)
