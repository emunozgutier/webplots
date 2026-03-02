import { create } from 'zustand';
import type { WorkspaceStores } from './WorkspaceContext';

export const workspaceRegistry = new Map<string, WorkspaceStores>();
export const cloneStoreStates = new Map<string, any>();

export interface Workspace {
    id: string;
    name: string;
}

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    isTopMenuBarOpen: boolean;

    // Actions
    addWorkspace: (workspace: Workspace) => void;
    removeWorkspace: (id: string) => void;
    updateWorkspaceName: (id: string, name: string) => void;
    setActiveWorkspaceId: (id: string) => void;
    toggleTopMenuBar: () => void;
    setTopMenuBarOpen: (isOpen: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    workspaces: [{ id: 'default', name: 'Workspace 1' }],
    activeWorkspaceId: 'default',
    isTopMenuBarOpen: true,

    addWorkspace: (workspace) => set((state) => ({
        workspaces: [...state.workspaces, workspace],
        activeWorkspaceId: workspace.id
    })),
    removeWorkspace: (id) => set((state) => {
        const remainingWorkspaces = state.workspaces.filter(w => w.id !== id);
        // If we remove the active workspace, switch to another one if available
        let newActiveId = state.activeWorkspaceId;
        if (state.activeWorkspaceId === id) {
            newActiveId = remainingWorkspaces.length > 0 ? remainingWorkspaces[0].id : '';
        }

        // If no workspaces left (should not happen in UI ideally, but just in case), create a default one
        if (remainingWorkspaces.length === 0) {
            const defaultWorkspace = { id: 'default', name: 'Workspace 1' };
            return {
                workspaces: [defaultWorkspace],
                activeWorkspaceId: 'default'
            };
        }

        return {
            workspaces: remainingWorkspaces,
            activeWorkspaceId: newActiveId
        };
    }),
    updateWorkspaceName: (id, name) => set((state) => ({
        workspaces: state.workspaces.map(w => w.id === id ? { ...w, name } : w)
    })),
    setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
    toggleTopMenuBar: () => set((state) => ({ isTopMenuBarOpen: !state.isTopMenuBarOpen })),
    setTopMenuBarOpen: (isOpen) => set({ isTopMenuBarOpen: isOpen }),
}));
