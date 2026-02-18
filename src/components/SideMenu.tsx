import React, { useMemo } from 'react';
import { usePlotDataStore } from '../store/PlotDataStore';
import { useSideMenuStore, createSideMenuConfig } from '../store/SideMenuStore';

const SideMenu: React.FC = () => {
    const { columns: storeColumns } = usePlotDataStore();
    const {
        sideMenuData,
        isMenuOpen,
        setXAxis,
        setYAxis,
        toggleMenu
    } = useSideMenuStore();

    const { columns, xAxis, yAxis, hasColumns } = useMemo(() => createSideMenuConfig(storeColumns, sideMenuData), [storeColumns, sideMenuData]);

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
                className="flex-grow-1 p-3"
                style={{
                    opacity: isMenuOpen ? 1 : 0,
                    transition: 'opacity 0.2s',
                    visibility: isMenuOpen ? 'visible' : 'hidden',
                    overflowY: 'auto'
                }}
            >
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-white fw-bold">
                        Data Configuration
                    </div>
                    <div className="card-body">
                        {hasColumns ? (
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
        </div>
    );
};

export default SideMenu;
