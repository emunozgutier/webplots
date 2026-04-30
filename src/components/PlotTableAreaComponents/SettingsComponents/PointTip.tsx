import React, { useState, useEffect } from 'react';
import { usePlotLayoutStore } from '../../../store/PlotTable/usePlotLayoutStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';

const PointTip: React.FC = () => {
    const { plotLayout, setPointTip, setCustomHoverConfig } = usePlotLayoutStore();
    const { closePopup } = useWorkspaceLocalStore();
    const { columns } = useCsvDataStore();

    const [localPointTip, setLocalPointTip] = useState<'default' | 'xy' | 'xy_absorbed' | 'xy_trace' | 'custom'>(plotLayout.pointTip || 'default');
    
    const [localCustomConfig, setLocalCustomConfig] = useState({
        showX: true,
        showY: true,
        showLabels: true,
        selectedColumns: [] as string[]
    });

    useEffect(() => {
        setLocalPointTip(plotLayout.pointTip || 'default');
        if (plotLayout.customHoverConfig) {
            setLocalCustomConfig(plotLayout.customHoverConfig);
        }
    }, [plotLayout.pointTip, plotLayout.customHoverConfig]);

    const handleSave = () => {
        setPointTip(localPointTip);
        if (localPointTip === 'custom') {
            setCustomHoverConfig(localCustomConfig);
        }
        closePopup();
    };

    const toggleColumn = (col: string) => {
        setLocalCustomConfig(prev => ({
            ...prev,
            selectedColumns: prev.selectedColumns.includes(col)
                ? prev.selectedColumns.filter(c => c !== col)
                : [...prev.selectedColumns, col]
        }));
    };

    return (
        <>
            <div className="card-body">
                <div className="mb-3">
                    <label className="form-label small fw-bold">Hover Information (Point Tip)</label>
                    <select
                        className="form-select form-select-sm"
                        value={localPointTip}
                        onChange={(e) => setLocalPointTip(e.target.value as any)}
                    >
                        <option value="default">Default</option>
                        <option value="xy">(X, Y) Coordinates Only</option>
                        <option value="xy_absorbed">(X, Y) Coordinates + Absorbed Points</option>
                        <option value="xy_trace">(X, Y) Coordinates + Trace Name</option>
                        <option value="custom">Custom...</option>
                    </select>
                    {localPointTip !== 'custom' && (
                        <div className="form-text text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                            Choose what information is displayed when hovering over points on the plot.
                            <br />
                            <em>Note: Automatically defaults to showing the Trace Name if the Legend is hidden.</em>
                        </div>
                    )}
                </div>

                {localPointTip === 'custom' && (
                    <div className="mt-3 p-3 border rounded bg-light">
                        <div className="fw-bold small mb-2 text-primary border-bottom pb-1">Custom Display Options</div>
                        
                        <div className="form-check form-switch mb-2">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="showLabelsToggle"
                                checked={localCustomConfig.showLabels}
                                onChange={e => setLocalCustomConfig(prev => ({ ...prev, showLabels: e.target.checked }))}
                            />
                            <label className="form-check-label small" htmlFor="showLabelsToggle">
                                Show Column Names (e.g. "Country: USA" vs "USA")
                            </label>
                        </div>

                        <div className="row mb-2">
                            <div className="col-6">
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="showXToggle"
                                        checked={localCustomConfig.showX}
                                        onChange={e => setLocalCustomConfig(prev => ({ ...prev, showX: e.target.checked }))}
                                    />
                                    <label className="form-check-label small" htmlFor="showXToggle">Show X Coordinate</label>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="showYToggle"
                                        checked={localCustomConfig.showY}
                                        onChange={e => setLocalCustomConfig(prev => ({ ...prev, showY: e.target.checked }))}
                                    />
                                    <label className="form-check-label small" htmlFor="showYToggle">Show Y Coordinate</label>
                                </div>
                            </div>
                        </div>

                        <div className="fw-bold small mb-1 mt-3">Additional Columns</div>
                        <div className="border rounded bg-white p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {columns.length > 0 ? columns.map(col => (
                                <div className="form-check" key={col}>
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id={`col-toggle-${col}`}
                                        checked={localCustomConfig.selectedColumns.includes(col)}
                                        onChange={() => toggleColumn(col)}
                                    />
                                    <label className="form-check-label small text-truncate d-block" htmlFor={`col-toggle-${col}`} title={col}>
                                        {col}
                                    </label>
                                </div>
                            )) : (
                                <div className="small text-muted fst-italic">No columns available</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="card-footer bg-light d-flex justify-content-end">
                <button className="btn btn-sm btn-secondary me-2" onClick={closePopup}>Close</button>
                <button className="btn btn-sm btn-primary" onClick={handleSave}>Save Settings</button>
            </div>
        </>
    );
};

export default PointTip;
