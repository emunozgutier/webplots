import re

def fix_store(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    content = re.sub(r"import \{ WorkspaceContext \} from '[^']+';\n", "", content)
    hook_regex = r"export const use[a-zA-Z]+Store = <T = [a-zA-Z]+>\(selector:[^\}]+return useStore\(context\.[a-zA-Z]+Store, selector\);\n?};\n?"
    content = re.sub(hook_regex, "", content, flags=re.MULTILINE | re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(content)

fix_store('src/store/PlotTable/useTableStore.ts')
fix_store('src/store/useAppLocalStore.ts')
