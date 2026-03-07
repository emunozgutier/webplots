import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

    isBetaMode: boolean;
    toggleBetaMode: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            workspaces: [{ id: 'default', name: 'Workspace 1' }],
            activeWorkspaceId: 'default',
            isTopMenuBarOpen: true,
            isBetaMode: false,

            addWorkspace: (workspace) => set((state) => ({
                workspaces: [...state.workspaces, workspace],
                activeWorkspaceId: workspace.id
            })),
            removeWorkspace: (id) => set((state) => {
                const remainingWorkspaces = state.workspaces.filter(w => w.id !== id);
                let newActiveId = state.activeWorkspaceId;
                if (state.activeWorkspaceId === id) {
                    newActiveId = remainingWorkspaces.length > 0 ? remainingWorkspaces[0].id : '';
                }

                if (remainingWorkspaces.length === 0) {
                    const defaultWorkspace = { id: 'default', name: 'Workspace 1' };
                    return {
                        workspaces: [defaultWorkspace],
                        activeWorkspaceId: 'default'
                    };
                }

                // Clean up workspace-specific stores from localStorage
                localStorage.removeItem(`webplots-workspace-${id}-axisSideMenuStore`);
                localStorage.removeItem(`webplots-workspace-${id}-colorSideMenuStore`);
                localStorage.removeItem(`webplots-workspace-${id}-filterSideMenuStore`);
                localStorage.removeItem(`webplots-workspace-${id}-groupSideMenuStore`);
                localStorage.removeItem(`webplots-workspace-${id}-inkRatioStore`);
                localStorage.removeItem(`webplots-workspace-${id}-plotLayoutStore`);
                localStorage.removeItem(`webplots-workspace-${id}-traceConfigStore`);
                localStorage.removeItem(`webplots-workspace-${id}-workspaceLocalStore`);
                localStorage.removeItem(`webplots-workspace-${id}-subplotSideMenuStore`);

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
            toggleBetaMode: () => set((state) => ({ isBetaMode: !state.isBetaMode })),
        }),
        {
            name: 'webplots-workspace-storage', // unique name
        }
    )
);
