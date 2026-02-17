import React from 'react';
import { useAppStore } from '../store';

const SideMenu: React.FC = () => {
    const {
        columns,
        plotArea,
        setXAxis,
        setYAxis
    } = useAppStore();

    const { xAxis, yAxis } = plotArea.axisMenuData;

    return (
        <div className="col-md-3 col-lg-2 bg-light border-end p-4">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-bold">
                    Data Configuration
                </div>
                <div className="card-body">
                    {columns.length > 0 ? (
                        <>
                            <div className="mb-3">
                                <label className="form-label fw-bold">X-Axis Column</label>
                                <select
                                    className="form-select"
                                    value={xAxis}
                                    onChange={(e) => setXAxis(e.target.value)}
                                >
                                    {columns.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Y-Axis Column</label>
                                <select
                                    className="form-select"
                                    value={yAxis}
                                    onChange={(e) => setYAxis(e.target.value)}
                                >
                                    {columns.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <p className="text-muted small">Please load a CSV file or Project from the <strong>File</strong> menu to configure axes.</p>
                    )}
                </div>
            </div>

            <div className="alert alert-info">
                <small>Use the Top Menu to load data.</small>
            </div>
        </div>
    );
};

export default SideMenu;
