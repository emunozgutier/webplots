import re
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Replace useWorkspaceLocalStore with useAppLocalStore
    content = content.replace("store/Workspace/useWorkspaceLocalStore", "store/useAppLocalStore")
    content = content.replace("useWorkspaceLocalStore", "useAppLocalStore")
    
    with open(filepath, 'w') as f:
        f.write(content)

for f in glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True):
    process_file(f)

