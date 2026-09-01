import re

def process(filepath, store_name):
    with open(filepath, 'r') as f:
        content = f.read()

    # Cleanup imports
    content = re.sub(r"import \{ createStore \} from 'zustand/vanilla';\n?", "", content)
    content = re.sub(r"import \{ useStore \} from 'zustand';\n?", "import { create } from 'zustand';\n", content)
    content = re.sub(r"import \{ useContext \} from 'react';\n?", "", content)

    # Convert createXYZStore to useXYZStore
    if "export const createTableStore = () => {" in content:
        content = content.replace("export const createTableStore = () => {", "")
        content = content.replace("    return createStore<TableState>()(", "export const useTableStore = create<TableState>()(")
        content = content.replace("        })\n    );\n};", "        })\n    );")
    
    if "export const createWorkspaceLocalStore = () => {" in content:
        content = content.replace("export const createWorkspaceLocalStore = () => {", "")
        content = content.replace("    return createStore<WorkspaceLocalState>()(", "export const useAppLocalStore = create<WorkspaceLocalState>()(")
        content = content.replace("        })\n    );\n};", "        })\n    );")

    with open(filepath, 'w') as f:
        f.write(content)

process('src/store/PlotTable/useTableStore.ts', 'Table')
process('src/store/useAppLocalStore.ts', 'AppLocal')
