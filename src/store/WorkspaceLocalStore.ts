import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export interface WorkspaceLocalState {
    isSideMenuOpen: boolean;
    popupContent: React.ReactNode | null;
    sideMenuWidth: number;
    toggleSideMenu: () => void;
    setSideMenuOpen: (isOpen: boolean) => void;
    setPopupContent: (content: React.ReactNode | null) => void;
    closePopup: () => void;
    setSideMenuWidth: (width: number) => void;
}

export const createWorkspaceLocalStore = () => {
    return createStore<WorkspaceLocalState>()((set) => ({
        isSideMenuOpen: true,
        popupContent: null,
        sideMenuWidth: 300,

        toggleSideMenu: () => set((state) => ({ isSideMenuOpen: !state.isSideMenuOpen })),
        setSideMenuOpen: (isOpen) => set({ isSideMenuOpen: isOpen }),
        setPopupContent: (content) => set({ popupContent: content }),
        closePopup: () => set({ popupContent: null }),
        setSideMenuWidth: (width) => set({ sideMenuWidth: width })
    }));
};

export const useWorkspaceLocalStore = <T = WorkspaceLocalState>(selector: (state: WorkspaceLocalState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useWorkspaceLocalStore must be used within WorkspaceProvider');
    return useStore(context.workspaceLocalStore, selector);
};
