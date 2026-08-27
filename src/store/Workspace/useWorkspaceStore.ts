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
    isDebugMode: boolean;
    isTutorialActive: boolean;

    // Actions
    addWorkspace: (workspace: Workspace) => void;
    removeWorkspace: (id: string) => void;
    updateWorkspaceName: (id: string, name: string) => void;
    setActiveWorkspaceId: (id: string) => void;
    toggleTopMenuBar: () => void;
    toggleDebugMode: () => void;
    setTopMenuBarOpen: (isOpen: boolean) => void;
    setIsTutorialActive: (isActive: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    (set) => ({
        workspaces: [{ id: 'default', name: 'Workspace 1' }],
        activeWorkspaceId: 'default',
        isTopMenuBarOpen: true,
        isDebugMode: typeof window !== 'undefined' && (window.location.pathname.endsWith('/beta') || window.location.hash.includes('/beta') || window.location.search.includes('beta')),
        isTutorialActive: true,

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
            localStorage.removeItem(`webplots-workspace-${id}-plotTypeSideMenuStore`);
            localStorage.removeItem(`webplots-workspace-${id}-styleSideMenuStore`);
            localStorage.removeItem(`webplots-workspace-${id}-filterSideMenuStore`);
            localStorage.removeItem(`webplots-workspace-${id}-groupSideMenuStore`);
            localStorage.removeItem(`webplots-workspace-${id}-inkRatioStore`);
            localStorage.removeItem(`webplots-workspace-${id}-plotLayoutStore`);
            localStorage.removeItem(`webplots-workspace-${id}-traceConfigStore`);
            localStorage.removeItem(`webplots-workspace-${id}-workspaceLocalStore`);
            localStorage.removeItem(`webplots-workspace-${id}-subplotSideMenuStore`);
            localStorage.removeItem(`webplots-workspace-${id}-tableStore`);
            localStorage.removeItem(`webplots-workspace-${id}-animationSideMenuStore`);
            localStorage.removeItem(`webplots-workspace-${id}-annotationSideMenuStore`);

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
        toggleDebugMode: () => set((state) => {
            const newDebugMode = !state.isDebugMode;
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                if (newDebugMode) {
                    if (!url.pathname.endsWith('/beta')) {
                        const newPath = url.pathname === '/' ? '/beta' : url.pathname.replace(/\/$/, '') + '/beta';
                        window.history.pushState({}, '', newPath + url.search + url.hash);
                    }
                } else {
                    if (url.pathname.endsWith('/beta')) {
                        const newPath = url.pathname.replace(/\/beta$/, '') || '/';
                        window.history.pushState({}, '', newPath + url.search + url.hash);
                    }
                }
            }
            return { isDebugMode: newDebugMode };
        }),
        setTopMenuBarOpen: (isOpen) => set({ isTopMenuBarOpen: isOpen }),
        setIsTutorialActive: (isActive) => set({ isTutorialActive: isActive }),
    })
);

if (typeof window !== 'undefined') {
    const win = window as unknown as { __registerZustandStore?: (store: unknown, name: string) => void };
    if (win.__registerZustandStore) {
        win.__registerZustandStore(useWorkspaceStore, 'WorkspaceStore');
    }
}
