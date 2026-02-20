import React, { useState } from 'react';

import { useAxisSideMenuStore } from '../../store/AxisSideMenuStore';
import SearchColumn from './SearchColumn';

interface AxisSideMenuProps {
    hasColumns: boolean;
}

const AxisSideMenu: React.FC<AxisSideMenuProps> = ({ hasColumns }) => {

    const {
        sideMenuData,
        setXAxis,
        addYAxisColumn,
        removeYAxisColumn,
        setGroupAxis
    } = useAxisSideMenuStore();

    const { xAxis, yAxis, groupAxis } = sideMenuData;

    const [dragOverX, setDragOverX] = useState(false);
    const [dragOverY, setDragOverY] = useState(false);
    const [dragOverGroup, setDragOverGroup] = useState(false);

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

    const handleDropGroup = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOverGroup(false);
        const colName = e.dataTransfer.getData('text/plain');
        if (colName) setGroupAxis(colName);
    };

    return (
        <div className="d-flex flex-column h-100 overflow-hidden">
            {hasColumns && (
                <div className="p-2 border-bottom" style={{ flex: '0 1 auto', maxHeight: '50%', minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                    <div className="d-flex flex-column h-100 overflow-hidden">
                        <div className="p-2 h-100 overflow-hidden d-flex flex-column">
                            <SearchColumn />
                        </div>
                    </div>
                </div>
            )}
            <div className="p-2 flex-grow-1" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                                                        <button
                                                            className="btn btn-sm btn-link text-white p-0 ms-1 opacity-75 hover-opacity-100"
                                                            onClick={() => removeYAxisColumn(col)}
                                                            style={{ textDecoration: 'none', lineHeight: 1 }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-muted small fst-italic text-center" style={{ fontSize: '0.8rem' }}>Drag column here</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-0">
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
                                                <button className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={() => setXAxis('')}>&times;</button>
                                            </div>
                                        ) : (
                                            <div className="text-muted small fst-italic text-center" style={{ fontSize: '0.8rem' }}>Drag column here</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-0 mt-3">
                                    <label className="form-label fw-bold small mb-2">Group Axis <small className="text-muted fw-normal">(Optional)</small></label>
                                    <div
                                        className={`border rounded p-2 ${dragOverGroup ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`}
                                        onDragOver={(e) => handleDragOver(e, setDragOverGroup)}
                                        onDragLeave={(e) => handleDragLeave(e, setDragOverGroup)}
                                        onDrop={handleDropGroup}
                                        style={{ minHeight: '35px', transition: 'all 0.2s' }}
                                    >
                                        {groupAxis ? (
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="badge bg-warning text-dark text-truncate mw-100">{groupAxis}</span>
                                                <button className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={() => setGroupAxis(null)}>&times;</button>
                                            </div>
                                        ) : (
                                            <div className="text-muted small fst-italic text-center" style={{ fontSize: '0.8rem' }}>Drag column here</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted small mb-0">Please load data first.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AxisSideMenu;
