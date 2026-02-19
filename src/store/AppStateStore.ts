import { create } from 'zustand';

interface AppState {
    isSideMenuOpen: boolean;
    isTopMenuBarOpen: boolean;
    popupContent: React.ReactNode | null;
    toggleSideMenu: () => void;
    toggleTopMenuBar: () => void;
    setSideMenuOpen: (isOpen: boolean) => void;
    setTopMenuBarOpen: (isOpen: boolean) => void;
    setPopupContent: (content: React.ReactNode | null) => void;
    closePopup: () => void;
    sideMenuWidth: number;
    setSideMenuWidth: (width: number) => void;
}

export const useAppStateStore = create<AppState>((set) => ({
    isSideMenuOpen: true,
    isTopMenuBarOpen: true,
    popupContent: null,
    toggleSideMenu: () => set((state) => ({ isSideMenuOpen: !state.isSideMenuOpen })),
    toggleTopMenuBar: () => set((state) => ({ isTopMenuBarOpen: !state.isTopMenuBarOpen })),
    setSideMenuOpen: (isOpen) => set({ isSideMenuOpen: isOpen }),
    setTopMenuBarOpen: (isOpen) => set({ isTopMenuBarOpen: isOpen }),
    setPopupContent: (content) => set({ popupContent: content }),
    closePopup: () => set({ popupContent: null }),
    sideMenuWidth: 300,
    setSideMenuWidth: (width) => set({ sideMenuWidth: width })
}));
