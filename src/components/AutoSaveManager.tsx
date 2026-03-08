import { useEffect } from 'react';
import { set } from 'idb-keyval';
import { useCsvDataStore } from '../store/CsvDataStore';
import { useWorkspaceStore, workspaceRegistry } from '../store/WorkspaceStore';

export const RECOVERY_KEY = 'webplots-recovered-project';

const AutoSaveManager = () => {
    useEffect(() => {
        const intervalId = setInterval(async () => {
            const workspaceStoreState = useWorkspaceStore.getState();
            if (workspaceStoreState.workspaces.length === 0) return;

            const csvState = useCsvDataStore.getState();
            const localStoresState: Record<string, any> = {};

            for (const workspace of workspaceStoreState.workspaces) {
                const stores = workspaceRegistry.get(workspace.id);
                if (stores) {
                    localStoresState[workspace.id] = {
                        axis: stores.axisSideMenuStore.getState(),
                        color: stores.colorSideMenuStore.getState(),
                        filter: stores.filterSideMenuStore.getState(),
                        group: stores.groupSideMenuStore.getState(),
                        ink: stores.inkRatioStore.getState(),
                        plot: stores.plotLayoutStore.getState(),
                        trace: stores.traceConfigStore.getState(),
                        subplot: stores.subplotSideMenuStore.getState(),
                        // Exclude React nodes from persist sequence to prevent cloning JSON stringify crash
                        local: { ...stores.workspaceLocalStore.getState(), popupContent: null }
                    };
                }
            }

            const backup = {
                timestamp: new Date().toISOString(),
                csvData: {
                    data: csvState.data,
                    columns: csvState.columns
                },
                workspaceStore: {
                    workspaces: workspaceStoreState.workspaces,
                    activeWorkspaceId: workspaceStoreState.activeWorkspaceId,
                    isTopMenuBarOpen: workspaceStoreState.isTopMenuBarOpen,
                    isBetaMode: workspaceStoreState.isBetaMode
                },
                localStores: localStoresState
            };

            try {
                await set(RECOVERY_KEY, backup);
            } catch (e) {
                console.error("AutoSaveManager Failed to backup plot configuration", e);
            }
        }, 3000); // Safely dump layout configurations to IndexedDB every 3 seconds

        return () => clearInterval(intervalId);
    }, []);

    return null;
};

export default AutoSaveManager;
