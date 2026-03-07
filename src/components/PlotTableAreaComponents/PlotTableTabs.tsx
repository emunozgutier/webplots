import React from 'react';


export const ViewToggleButtons: React.FC<{ viewMode: 'plot' | 'table'; setViewMode: (mode: 'plot' | 'table') => void; }> = ({ viewMode, setViewMode }) => {
    return (
        <ul className="nav nav-tabs border-0">
            <li className="nav-item me-1">
                <button
                    className={`nav-link fs-5 px-4 py-2 ${viewMode === 'plot' ? 'active fw-bold bg-white text-primary' : 'text-primary bg-light'}`}
                    onClick={() => setViewMode('plot')}
                    title="View Plot"
                    style={{
                        borderTop: viewMode === 'plot' ? '3px solid var(--bs-primary)' : '3px solid transparent',
                        borderLeft: viewMode === 'plot' ? '3px solid var(--bs-primary)' : '3px solid transparent',
                        borderRight: viewMode === 'plot' ? '3px solid var(--bs-primary)' : '3px solid transparent',
                        borderBottom: viewMode === 'plot' ? '3px solid white' : 'none',
                        borderRadius: '0.375rem 0.375rem 0 0',
                        marginBottom: viewMode === 'plot' ? '-3px' : '0',
                        position: 'relative',
                        zIndex: viewMode === 'plot' ? 1 : 0
                    }}
                >
                    🎨 Plot
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link fs-5 px-4 py-2 ${viewMode === 'table' ? 'active fw-bold bg-white text-primary' : 'text-primary bg-light'}`}
                    onClick={() => setViewMode('table')}
                    title="View Table"
                    style={{
                        borderTop: viewMode === 'table' ? '3px solid var(--bs-primary)' : '3px solid transparent',
                        borderLeft: viewMode === 'table' ? '3px solid var(--bs-primary)' : '3px solid transparent',
                        borderRight: viewMode === 'table' ? '3px solid var(--bs-primary)' : '3px solid transparent',
                        borderBottom: viewMode === 'table' ? '3px solid white' : 'none',
                        borderRadius: '0.375rem 0.375rem 0 0',
                        marginBottom: viewMode === 'table' ? '-3px' : '0',
                        position: 'relative',
                        zIndex: viewMode === 'table' ? 1 : 0
                    }}
                >
                    📇 Table
                </button>
            </li>
        </ul>
    );
};

