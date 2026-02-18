import React, { useMemo, useState } from 'react';
import { usePlotDataStore } from '../store/PlotDataStore';
import { useSideMenuStore, createSideMenuConfig } from '../store/SideMenuStore';
import SideMenuSearch from './SideMenuComponents/SideMenuSearch';

const SideMenu: React.FC = () => {
    const { columns: storeColumns } = usePlotDataStore();
    const {
        sideMenuData,
        isMenuOpen,
        setXAxis,
        addYAxisColumn,
        removeYAxisColumn,
        toggleMenu
    } = useSideMenuStore();

    const { xAxis, yAxis, hasColumns } = useMemo(() => createSideMenuConfig(storeColumns, sideMenuData), [storeColumns, sideMenuData]);
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
        <div
            className="bg-light border-end d-flex flex-column"
            style={{
                width: isMenuOpen ? '320px' : '50px',
                transition: 'width 0.3s ease-in-out',
                overflow: 'hidden',
                flexShrink: 0
            }}
        >
            <div className={`d-flex align-items-center p-2 ${isMenuOpen ? 'justify-content-between' : 'justify-content-center'}`}>
                {isMenuOpen && <span className="fw-bold text-nowrap">Configuration</span>}
                <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={toggleMenu}
                    title={isMenuOpen ? "Collapse Menu" : "Expand Menu"}
                >
                    {isMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-left" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    )}
                </button>
            </div>

            <div
                className="flex-grow-1 d-flex flex-column"
                style={{
                    opacity: isMenuOpen ? 1 : 0,
                    transition: 'opacity 0.2s',
                    visibility: isMenuOpen ? 'visible' : 'hidden',
                    overflow: 'hidden'
                }}
            >
                {hasColumns && (
                    <div className="p-3" style={{ height: '50%', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                        <div className="card shadow-sm h-100 d-flex flex-column overflow-hidden">
                            <div className="card-header bg-white fw-bold flex-shrink-0">
                                Available Columns
                            </div>
                            <div className="card-body p-2 overflow-hidden d-flex flex-column">
                                <SideMenuSearch />
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-3 pt-0 flex-grow-1" style={{ height: '50%', minHeight: '200px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="card shadow-sm h-100 d-flex flex-column overflow-hidden">
                        <div className="card-header bg-white fw-bold flex-shrink-0">
                            Axes Configuration
                        </div>
                        <div className="card-body overflow-auto">
                            {hasColumns ? (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Y-Axis <small className="text-muted fw-normal">({yAxis.length}/8)</small></label>
                                        <div
                                            className={`border rounded p-2 ${dragOverY ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`}
                                            onDragOver={(e) => handleDragOver(e, setDragOverY)}
                                            onDragLeave={(e) => handleDragLeave(e, setDragOverY)}
                                            onDrop={handleDropY}
                                            style={{ minHeight: '40px', transition: 'all 0.2s' }}
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
                                                <div className="text-muted small fst-italic text-center">Drag column here</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-0">
                                        <label className="form-label fw-bold">X-Axis</label>
                                        <div
                                            className={`border rounded p-2 ${dragOverX ? 'bg-info bg-opacity-10 border-info' : 'bg-white'}`}
                                            onDragOver={(e) => handleDragOver(e, setDragOverX)}
                                            onDragLeave={(e) => handleDragLeave(e, setDragOverX)}
                                            onDrop={handleDropX}
                                            style={{ minHeight: '40px', transition: 'all 0.2s' }}
                                        >
                                            {xAxis ? (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge bg-primary text-truncate mw-100">{xAxis}</span>
                                                    <button className="btn btn-sm btn-link text-danger p-0 ms-1" onClick={() => setXAxis('')}>&times;</button>
                                                </div>
                                            ) : (
                                                <div className="text-muted small fst-italic text-center">Drag column here</div>
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
        </div>
    );
};

export default SideMenu;
