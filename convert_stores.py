import os
import re
import glob

files = glob.glob('src/store/**/*.ts', recursive=True)

store_files = [
    'useAxisSideMenuStore.ts',
    'usePlotTypeSideMenuStore.ts',
    'useStyleSideMenuStore.ts',
    'useFilterSideMenuStore.ts',
    'useGroupSideMenuStore.ts',
    'useInkRatioStore.ts',
    'usePlotLayoutStore.ts',
    'useTraceConfigStore.ts',
    'useSubplotSideMenuStore.ts',
    'useTableStore.ts',
    'useAnimationSideMenuStore.ts',
    'useAnnotationSideMenuStore.ts',
    'useWorkspaceLocalStore.ts'
]

def process_file(filepath):
    if not any(filepath.endswith(name) for name in store_files):
        return
        
    with open(filepath, 'r') as f:
        content = f.read()
        
    print(f"Processing {filepath}")
    
    # 1. Update imports
    content = re.sub(r"import \{ createStore \} from 'zustand/vanilla';\n?", "", content)
    content = re.sub(r"import \{ useStore \} from 'zustand';\n?", "import { create } from 'zustand';\n", content)
    content = re.sub(r"import \{ useContext \} from 'react';\n?", "", content)
    content = re.sub(r"import \{ WorkspaceContext \} from '../Workspace/WorkspaceContext';\n?", "", content)
    content = re.sub(r"import \{ WorkspaceContext \} from '\.\./WorkspaceContext';\n?", "", content)
    
    # 2. Extract the state type name
    match = re.search(r"export const create([a-zA-Z]+Store) = \(\) => createStore<([a-zA-Z]+)?>\(\)\(", content)
    if match:
        store_name_cap = match.group(1) # e.g. AxisSideMenuStore
        state_type = match.group(2) # e.g. AxisSideMenuState
        
        if filepath.endswith('useWorkspaceLocalStore.ts'):
            hook_name = 'useAppLocalStore'
        else:
            hook_name = 'use' + store_name_cap
            
        # 3. Replace create function with hook definition
        if state_type:
            content = content.replace(
                f"export const create{store_name_cap} = () => createStore<{state_type}>()(",
                f"export const {hook_name} = create<{state_type}>()("
            )
        else:
            content = content.replace(
                f"export const create{store_name_cap} = () => createStore()(",
                f"export const {hook_name} = create()("
            )
        
        # 4. Remove the old hook definition completely
        hook_regex = r"export const use[a-zA-Z]+Store = <T = [a-zA-Z]+>\(selector:[^\}]+return useStore\(context\.[a-zA-Z]+Store, selector\);\n?};\n?"
        content = re.sub(hook_regex, "", content, flags=re.MULTILINE | re.DOTALL)
        
        with open(filepath, 'w') as f:
            f.write(content)
            
for f in files:
    process_file(f)
