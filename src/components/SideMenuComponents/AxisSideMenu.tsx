import React, { useState } from 'react';

import { useAxisSideMenuStore } from '../../store/SideMenu/useAxisSideMenuStore';
// Removed useAppStateStore

import SearchColumn from './subcomponents/SearchColumn';
import CloseButton from './subcomponents/CloseButton';

interface AxisSideMenuProps {
    hasColumns: boolean;
}

const AxisSideMenu: React.FC<AxisSideMenuProps> = ({ hasColumns }) => {

    const {
        sideMenuData,
        setPlotType,
        setXAxis,
        addYAxisColumn,
        removeYAxisColumn
    } = useAxisSideMenuStore();

    const { plotType, xAxis, yAxis } = sideMenuData;

    const [dragOverX, setDragOverX] = useState(false);
    const [dragOverY, setDragOverY] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, setDragOver: (val: boolean) => void) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, setDragOver: (val: boolean) => void) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDropX = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverX(false);
        const colName = e.dataTransfer.getData('text/plain');
        if (colName) setXAxis(colName);
    };

    const handleDropY = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverY(false);
        const colName = e.dataTransfer.getData('text/plain');
        if (colName) addYAxisColumn(colName);
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">

            {hasColumns && (
                <div className="p-2 border-bottom" style={{ flex: '1 1 0', minHeight: '150px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="d-flex flex-column h-100 overflow-hidden">
                        <div className="p-2 h-100 overflow-hidden d-flex flex-column">
                            <SearchColumn />
                        </div>
                    </div>
                </div>
            )}
            <div className="p-2" style={{ flex: '1 1 0', minHeight: '150px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex flex-column h-100 overflow-hidden">
                    <div className="overflow-auto h-100">
                        {hasColumns ? (
                            <>
                                <div className="mb-3">
                                    <label className="form-label fw-bold small mb-2">Y-Axis <small className="text-muted fw-normal">({yAxis.length}/8)</small></label>
                                    <div
                                        className={`border rounded p-2 ${dragOverY ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`}
                                        onDragOver={(e) => handleDragOver(e, setDragOverY)}
                                        onDragLeave={(e) => handleDragLeave(e, setDragOverY)}
                                        onDrop={handleDropY}
                                        style={{ minHeight: '35px', transition: 'all 0.2s' }}
                                    >
                                        {yAxis.length > 0 ? (
                                            <div className="d-flex flex-wrap gap-1">
                                                {yAxis.map(col => (
                                                    <div key={col} className="d-flex align-items-center badge bg-success text-truncate mw-100 mb-1">
                                                        <span className="text-truncate">{col}</span>
                                                        <CloseButton 
                                                            onClose={() => removeYAxisColumn(col)} 
                                                            title="Hold 2s to Remove"
                                                            colorClass="white"
                                                            className="opacity-75"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-muted small fst-italic text-center" style={{ fontSize: '0.8rem' }}>Drag column here</div>
                                        )}
                                    </div>
                                </div>

                                {plotType !== 'histogram' && (
                                    <div className="mb-0 mt-3">
                                        <label className="form-label fw-bold small mb-2">X-Axis</label>
                                        <div
                                            className={`border rounded p-2 ${dragOverX ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`}
                                            onDragOver={(e) => handleDragOver(e, setDragOverX)}
                                            onDragLeave={(e) => handleDragLeave(e, setDragOverX)}
                                            onDrop={handleDropX}
                                            style={{ minHeight: '35px', transition: 'all 0.2s' }}
                                        >
                                            {xAxis ? (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge bg-primary text-truncate mw-100">{xAxis}</span>
                                                    <CloseButton 
                                                        onClose={() => setXAxis('')} 
                                                        title="Hold 2s to Remove"
                                                        colorClass="danger"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-muted small fst-italic text-center d-flex flex-column" style={{ fontSize: '0.8rem' }}>
                                                    <span className="fw-bold mb-1">Default: Row Number</span>
                                                    <span>Drag column here to override</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-muted small mb-0">Please load data first.</p>
                        )}
                    </div>
                </div>
            </div>
            {hasColumns && (
                <div className="p-3 bg-white border-top shadow-sm" style={{ flex: '0 0 auto' }}>
                    <div className="d-flex justify-content-center align-items-center mb-2">
                        <span className="badge bg-secondary-subtle text-secondary border small fw-bold px-3 py-1">PLOT TYPE</span>
                    </div>
                    <div className="btn-group w-100" role="group">
                        <input type="radio" className="btn-check" name="plotType" id="plotScatter" autoComplete="off" checked={plotType === 'scatter'} onChange={() => setPlotType('scatter')} />
                        <label className="btn btn-outline-primary btn-sm py-2" htmlFor="plotScatter">
                            <i className="bi bi-graph-up me-1"></i> Scatter
                        </label>

                        <input type="radio" className="btn-check" name="plotType" id="plotHistogram" autoComplete="off" checked={plotType === 'histogram'} onChange={() => setPlotType('histogram')} />
                        <label className="btn btn-outline-primary btn-sm py-2" htmlFor="plotHistogram">
                            <i className="bi bi-bar-chart-fill me-1"></i> Histogram
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AxisSideMenu;
