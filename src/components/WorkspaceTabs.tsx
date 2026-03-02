import React, { useState } from 'react';
import { useWorkspaceStore, workspaceRegistry, cloneStoreStates } from '../store/WorkspaceStore';

const WorkspaceTabs: React.FC = () => {
    const { workspaces, activeWorkspaceId, setActiveWorkspaceId, addWorkspace, removeWorkspace, updateWorkspaceName } = useWorkspaceStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAdd = () => {
        const id = `ws-${Date.now()}`;
        let maxNum = 0;
        workspaces.forEach(ws => {
            const match = ws.name.match(/^Workspace (\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        const name = `Workspace ${maxNum + 1}`;
        addWorkspace({ id, name });
    };

    const startEditing = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const handleEditSave = (id: string) => {
        if (editName.trim()) {
            updateWorkspaceName(id, editName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="d-flex bg-light border-bottom px-2 pt-2 gap-1 overflow-auto align-items-end flex-nowrap" style={{ minHeight: '42px' }}>
            {workspaces.map((ws) => (
                <div
                    key={ws.id}
                    className={`d-flex align-items-center flex-shrink-0 px-3 py-1 border border-bottom-0 rounded-top cursor-pointer ${ws.id === activeWorkspaceId ? 'bg-white font-weight-bold shadow-sm' : 'bg-light text-muted'
                        }`}
                    style={{ cursor: 'pointer', zIndex: ws.id === activeWorkspaceId ? 1 : 0, marginBottom: '-1px' }}
                    onClick={() => setActiveWorkspaceId(ws.id)}
                >
                    {editingId === ws.id ? (
                        <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => handleEditSave(ws.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave(ws.id);
                                if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="form-control form-control-sm border-0 bg-transparent p-0 m-0"
                            style={{ width: '100px', boxShadow: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span onDoubleClick={(e) => { e.stopPropagation(); startEditing(ws.id, ws.name); }}>
                            {ws.name}
                        </span>
                    )}

                    {/* Actions */}
                    <div className="d-flex align-items-center ms-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="btn btn-link btn-sm text-secondary p-0 ms-1 text-decoration-none"
                            title="Duplicate Workspace"
                            onClick={(e) => {
                                e.stopPropagation();
                                const newId = `ws-${Date.now()}`;
                                const sourceStores = workspaceRegistry.get(ws.id);
                                if (sourceStores) {
                                    const stateSnapshot = {
                                        axis: sourceStores.axisSideMenuStore.getState(),
                                        color: sourceStores.colorSideMenuStore.getState(),
                                        filter: sourceStores.filterSideMenuStore.getState(),
                                        group: sourceStores.groupSideMenuStore.getState(),
                                        ink: sourceStores.inkRatioStore.getState(),
                                        plot: sourceStores.plotLayoutStore.getState(),
                                        trace: sourceStores.traceConfigStore.getState(),
                                    };
                                    cloneStoreStates.set(newId, JSON.parse(JSON.stringify(stateSnapshot)));
                                }
                                addWorkspace({ id: newId, name: `${ws.name} (Copy)` });
                            }}
                        >
                            <i className="bi bi-files" style={{ fontSize: '0.75rem' }}></i>
                        </button>
                        {workspaces.length > 1 && (
                            <button
                                className="btn btn-link btn-sm text-secondary p-0 ms-1 text-decoration-none"
                                title="Close Workspace"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeWorkspace(ws.id);
                                }}
                            >
                                <i className="bi bi-x" style={{ fontSize: '1rem', lineHeight: 1 }}></i>
                            </button>
                        )}
                    </div>
                </div>
            ))}

            <button
                className="btn btn-sm btn-light border-0 text-secondary d-flex align-items-center flex-shrink-0 mb-1"
                onClick={handleAdd}
                title="New Workspace"
            >
                <i className="bi bi-plus-lg"></i>
            </button>
        </div>
    );
};

export default WorkspaceTabs;
