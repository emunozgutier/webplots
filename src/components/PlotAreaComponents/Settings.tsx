import React, { useState } from 'react';
import { usePlotAreaStore } from '../../store/PlotAreaStore';

const Settings: React.FC = () => {
    const { plotArea, setPlotTitle, setXAxisTitle, setYAxisTitle, setXRange, setYRange, toggleSettings } = usePlotAreaStore();

    // Local state for inputs to avoid too many re-renders while typing
    const [localPlotTitle, setLocalPlotTitle] = useState(plotArea.plotTitle || '');
    const [localXTitle, setLocalXTitle] = useState(plotArea.xAxisTitle || '');
    const [localYTitle, setLocalYTitle] = useState(plotArea.yAxisTitle || '');
    const [localXMin, setLocalXMin] = useState(plotArea.xRange ? plotArea.xRange[0].toString() : '');
    const [localXMax, setLocalXMax] = useState(plotArea.xRange ? plotArea.xRange[1].toString() : '');
    const [localYMin, setLocalYMin] = useState(plotArea.yRange ? plotArea.yRange[0].toString() : '');
    const [localYMax, setLocalYMax] = useState(plotArea.yRange ? plotArea.yRange[1].toString() : '');

    const handleSave = () => {
        setPlotTitle(localPlotTitle);
        setXAxisTitle(localXTitle);
        setYAxisTitle(localYTitle);

        if (localXMin && localXMax) {
            setXRange([parseFloat(localXMin), parseFloat(localXMax)]);
        } else {
            setXRange(null);
        }

        if (localYMin && localYMax) {
            setYRange([parseFloat(localYMin), parseFloat(localYMax)]);
        } else {
            setYRange(null);
        }

        toggleSettings();
    };

    if (!plotArea.isSettingsOpen) return null;

    return (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="card shadow-lg" style={{ width: '400px' }}>
                <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
                    <span>Plot Settings</span>
                    <button className="btn btn-sm btn-close" onClick={toggleSettings}></button>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Plot Title</label>
                        <input type="text" className="form-control form-control-sm" value={localPlotTitle} onChange={e => setLocalPlotTitle(e.target.value)} />
                    </div>
                    <div className="row mb-3">
                        <div className="col-6">
                            <label className="form-label small fw-bold">X-Axis Title</label>
                            <input type="text" className="form-control form-control-sm" value={localXTitle} onChange={e => setLocalXTitle(e.target.value)} />
                        </div>
                        <div className="col-6">
                            <label className="form-label small fw-bold">Y-Axis Title</label>
                            <input type="text" className="form-control form-control-sm" value={localYTitle} onChange={e => setLocalYTitle(e.target.value)} />
                        </div>
                    </div>

                    <hr />

                    <div className="mb-2">
                        <label className="form-label small fw-bold">X-Axis Range</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">Min</span>
                            <input type="number" className="form-control" value={localXMin} onChange={e => setLocalXMin(e.target.value)} />
                            <span className="input-group-text">Max</span>
                            <input type="number" className="form-control" value={localXMax} onChange={e => setLocalXMax(e.target.value)} />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label small fw-bold">Y-Axis Range</label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">Min</span>
                            <input type="number" className="form-control" value={localYMin} onChange={e => setLocalYMin(e.target.value)} />
                            <span className="input-group-text">Max</span>
                            <input type="number" className="form-control" value={localYMax} onChange={e => setLocalYMax(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="card-footer bg-light d-flex justify-content-end">
                    <button className="btn btn-sm btn-secondary me-2" onClick={toggleSettings}>Cancel</button>
                    <button className="btn btn-sm btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
