import React from 'react';


export const ViewToggleButtons: React.FC<{ viewMode: 'plot' | 'table'; setViewMode: (mode: 'plot' | 'table') => void; }> = ({ viewMode, setViewMode }) => {
    return (
        <ul className="nav nav-tabs border-bottom-0">
            <li className="nav-item">
                <button
                    className={`nav-link fs-5 px-4 py-2 ${viewMode === 'plot' ? 'active fw-bold bg-white text-primary' : 'text-secondary bg-light border-0'}`}
                    onClick={() => setViewMode('plot')}
                    title="View Plot"
                    style={{
                        borderTop: viewMode === 'plot' ? '6px solid transparent' : '6px solid var(--bs-primary)',
                        borderBottom: viewMode === 'plot' ? '1px solid white' : '1px solid #dee2e6',
                        borderRadius: '0.375rem 0.375rem 0 0',
                        marginBottom: '-1px'
                    }}
                >
                    🎨 Plot
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link fs-5 px-4 py-2 ${viewMode === 'table' ? 'active fw-bold bg-white text-primary' : 'text-secondary bg-light border-0'}`}
                    onClick={() => setViewMode('table')}
                    title="View Table"
                    style={{
                        borderTop: viewMode === 'table' ? '6px solid transparent' : '6px solid var(--bs-primary)',
                        borderBottom: viewMode === 'table' ? '1px solid white' : '1px solid #dee2e6',
                        borderRadius: '0.375rem 0.375rem 0 0',
                        marginBottom: '-1px'
                    }}
                >
                    📇 Table
                </button>
            </li>
        </ul>
    );
};

