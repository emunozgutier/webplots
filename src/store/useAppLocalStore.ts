import { create } from 'zustand';


export interface WorkspaceLocalState {
    isSideMenuOpen: boolean;
    isDebugMode: boolean;
    popupContent: React.ReactNode | null;
    sideMenuWidth: number;
    toggleSideMenu: () => void;
    toggleDebugMode: () => void;
    setSideMenuOpen: (isOpen: boolean) => void;
    setPopupContent: (content: React.ReactNode | null) => void;
    closePopup: () => void;
    setSideMenuWidth: (width: number) => void;
}


export const useAppLocalStore = create<WorkspaceLocalState>()(
        (set) => ({
            isSideMenuOpen: true,
            isDebugMode: false,
            popupContent: null,
            sideMenuWidth: 300,

            toggleSideMenu: () => set((state) => ({ isSideMenuOpen: !state.isSideMenuOpen })),
            toggleDebugMode: () => set((state) => ({ isDebugMode: !state.isDebugMode })),
            setSideMenuOpen: (isOpen) => set({ isSideMenuOpen: isOpen }),
            setPopupContent: (content) => set({ popupContent: content }),
            closePopup: () => set({ popupContent: null }),
            setSideMenuWidth: (width) => set({ sideMenuWidth: width })
        })
    );

