
import React from 'react';

interface SideMenuProps {
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    columns: string[];
    xAxis: string;
    setXAxis: (value: string) => void;
    yAxis: string;
    setYAxis: (value: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
    onFileUpload,
    columns,
    xAxis,
    setXAxis,
    yAxis,
    setYAxis
}) => {
    return (
        <div className="col-md-3 col-lg-2 bg-light border-end p-4">
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-bold">
                    Data Configuration
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Upload CSV File</label>
                        <input
                            type="file"
                            className="form-control"
                            accept=".csv"
                            onChange={onFileUpload}
                        />
                    </div>

                    {columns.length > 0 && (
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
                    )}
                </div>
            </div>

            <div className="alert alert-info">
                <small>Upload a CSV file to visualize data points dynamically.</small>
            </div>
        </div>
    );
};

export default SideMenu;
