import React, { useState, useEffect } from 'react';
import { usePlotLayoutStore } from '../../../store/PlotLayoutStore';
import { useWorkspaceLocalStore } from '../../../store/WorkspaceLocalStore';

const PointTip: React.FC = () => {
    const { plotLayout, setPointTip } = usePlotLayoutStore();
    const { closePopup } = useWorkspaceLocalStore();

    const [localPointTip, setLocalPointTip] = useState<'default' | 'xy' | 'xy_absorbed' | 'xy_trace'>(plotLayout.pointTip || 'default');

    useEffect(() => {
        setLocalPointTip(plotLayout.pointTip || 'default');
    }, [plotLayout.pointTip]);

    const handleSave = () => {
        setPointTip(localPointTip);
        closePopup();
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
                    </select>
                    <div className="form-text text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                        Choose what information is displayed when hovering over points on the plot.
                        <br />
                        <em>Note: Automatically defaults to showing the Trace Name if the Legend is hidden.</em>
                    </div>
                </div>
            </div>
            <div className="card-footer bg-light d-flex justify-content-end">
                <button className="btn btn-sm btn-secondary me-2" onClick={closePopup}>Close</button>
                <button className="btn btn-sm btn-primary" onClick={handleSave}>Save Settings</button>
            </div>
        </>
    );
};

export default PointTip;
