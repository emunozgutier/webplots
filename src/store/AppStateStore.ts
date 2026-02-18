import { create } from 'zustand';

interface AppState {
    isSideMenuOpen: boolean;
    isTopMenuBarOpen: boolean;
    toggleSideMenu: () => void;
    toggleTopMenuBar: () => void;
    setSideMenuOpen: (isOpen: boolean) => void;
    setTopMenuBarOpen: (isOpen: boolean) => void;
}

export const useAppStateStore = create<AppState>((set) => ({
    isSideMenuOpen: true,
    isTopMenuBarOpen: true,
    toggleSideMenu: () => set((state) => ({ isSideMenuOpen: !state.isSideMenuOpen })),
    toggleTopMenuBar: () => set((state) => ({ isTopMenuBarOpen: !state.isTopMenuBarOpen })),
    setSideMenuOpen: (isOpen) => set({ isSideMenuOpen: isOpen }),
    setTopMenuBarOpen: (isOpen) => set({ isTopMenuBarOpen: isOpen })
}));
