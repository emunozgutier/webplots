import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useContext } from 'react';
import { WorkspaceContext } from '../Workspace/WorkspaceContext';

export interface GroupStyleConfig {
    color?: string;
    symbol?: string;
}

export interface GroupSettings {
    mode: 'auto' | 'manual';
    bins: {
        id: string;
        label: string;
        operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
        value: number;
        color?: string;
        symbol?: string;
    }[];
    categoryStyles?: Record<string, GroupStyleConfig>;
    styleMode?: 'color' | 'symbol' | 'none';
}

export interface GroupSideMenuData {
    groupAxis: string | null;
    groupAxes?: string[];
    groupSettings: Record<string, GroupSettings>;
}

export type GroupSideMenuState = {
    groupSideMenuData: GroupSideMenuData;
    setGroupAxis: (groupAxis: string | null) => void;
    addGroupAxis: (column: string) => void;
    removeGroupAxis: (column: string) => void;
    setGroupAxes: (groupAxes: string[]) => void;
    setGroupSettings: (column: string, settings: GroupSettings) => void;
    loadProject: (groupAxis?: string | null, groupSettings?: Record<string, GroupSettings>, groupAxes?: string[]) => void;
}

export const createGroupSideMenuStore = () => createStore<GroupSideMenuState>()(
    (set) => ({
        groupSideMenuData: {
            groupAxis: null,
            groupAxes: [],
            groupSettings: {}
        },
        setGroupAxis: (groupAxis) => set((state) => ({
            groupSideMenuData: {
                ...state.groupSideMenuData,
                groupAxis,
                groupAxes: groupAxis ? [groupAxis] : []
            }
        })),
        addGroupAxis: (column) => set((state) => {
            const currentAxes = state.groupSideMenuData.groupAxes || (state.groupSideMenuData.groupAxis ? [state.groupSideMenuData.groupAxis] : []);
            if (currentAxes.includes(column)) return state;
            const newAxes = [...currentAxes, column];
            return {
                groupSideMenuData: {
                    ...state.groupSideMenuData,
                    groupAxis: newAxes[0] || null,
                    groupAxes: newAxes
                }
            };
        }),
        removeGroupAxis: (column) => set((state) => {
            const currentAxes = state.groupSideMenuData.groupAxes || (state.groupSideMenuData.groupAxis ? [state.groupSideMenuData.groupAxis] : []);
            const newAxes = currentAxes.filter(col => col !== column);
            return {
                groupSideMenuData: {
                    ...state.groupSideMenuData,
                    groupAxis: newAxes[0] || null,
                    groupAxes: newAxes
                }
            };
        }),
        setGroupAxes: (groupAxes) => set((state) => ({
            groupSideMenuData: {
                ...state.groupSideMenuData,
                groupAxis: groupAxes[0] || null,
                groupAxes
            }
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
        loadProject: (groupAxis = null, groupSettings = {}, groupAxes?: string[]) => set(() => {
            const resolvedAxes = groupAxes || (groupAxis ? [groupAxis] : []);
            return {
                groupSideMenuData: {
                    groupAxis: resolvedAxes[0] || groupAxis || null,
                    groupAxes: resolvedAxes,
                    groupSettings
                }
            };
        })
    })
);

export const useGroupSideMenuStore = <T = GroupSideMenuState>(selector: (state: GroupSideMenuState) => T = (state) => state as unknown as T): T => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useGroupSideMenuStore must be used within WorkspaceProvider');
    return useStore(context.groupSideMenuStore, selector);
};
