import { create } from 'zustand';

interface WorkspaceState {
    isTopMenuBarOpen: boolean;
    isDebugMode: boolean;
    isTutorialActive: boolean;

    // Actions
    toggleTopMenuBar: () => void;
    toggleDebugMode: () => void;
    setTopMenuBarOpen: (isOpen: boolean) => void;
    setIsTutorialActive: (isActive: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    (set) => ({
        isTopMenuBarOpen: true,
        isDebugMode: typeof window !== 'undefined' && (window.location.pathname.endsWith('/beta') || window.location.hash.includes('/beta') || window.location.search.includes('beta')),
        isTutorialActive: true,

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
