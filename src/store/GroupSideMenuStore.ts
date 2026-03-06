import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { useContext } from 'react';
import { WorkspaceContext } from './WorkspaceContext';

export interface GroupSettings {
    mode: 'auto' | 'manual';
    bins: {
        id: string;
        label: string;
        operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
        value: number;
    }[];
}

export interface GroupSideMenuData {
    groupAxis: string | null;
    groupSettings: Record<string, GroupSettings>;
}

export type GroupSideMenuState = {
    groupSideMenuData: GroupSideMenuData;
    setGroupAxis: (groupAxis: string | null) => void;
    setGroupSettings: (column: string, settings: GroupSettings) => void;
    loadProject: (groupAxis?: string | null, groupSettings?: Record<string, GroupSettings>) => void;
}

export const createGroupSideMenuStore = (workspaceId: string) => createStore<GroupSideMenuState>()(
    persist(
        (set) => ({
            groupSideMenuData: {
                groupAxis: null,
                groupSettings: {}
            },
            setGroupAxis: (groupAxis) => set((state) => ({
                groupSideMenuData: { ...state.groupSideMenuData, groupAxis }
            })),
            setGroupSettings: (column, settings) => set((state) => ({
                groupSideMenuData: {
                    ...state.groupSideMenuData,
                    groupSettings: {
                        ...state.groupSideMenuData.groupSettings,
                        [column]: settings
                    }
                }
            })),
            loadProject: (groupAxis = null, groupSettings = {}) => set(() => ({
                groupSideMenuData: { groupAxis, groupSettings }
            }))
        }),
        {
            name: `webplots-workspace-${workspaceId}-groupSideMenuStore`
        }
    )
);

export const useGroupSideMenuStore = <T = GroupSideMenuState>(selector: (state: GroupSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useGroupSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.groupSideMenuStore, selector);
};
