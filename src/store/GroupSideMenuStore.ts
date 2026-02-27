import { create } from 'zustand';

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

interface GroupSideMenuState {
    groupSideMenuData: GroupSideMenuData;
    setGroupAxis: (groupAxis: string | null) => void;
    setGroupSettings: (column: string, settings: GroupSettings) => void;
    loadProject: (groupAxis?: string | null, groupSettings?: Record<string, GroupSettings>) => void;
}

export const useGroupSideMenuStore = create<GroupSideMenuState>((set) => ({
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
}));
