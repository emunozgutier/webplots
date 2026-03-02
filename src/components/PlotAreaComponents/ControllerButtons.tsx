import React from 'react';


export const ViewToggleButtons: React.FC<{ viewMode: 'plot' | 'table'; setViewMode: (mode: 'plot' | 'table') => void; }> = ({ viewMode, setViewMode }) => {
    return (
        <ul className="nav nav-tabs border-bottom-0">
            <li className="nav-item">
                <button
                    className={`nav-link fs-5 px-4 py-2 rounded-top ${viewMode === 'plot' ? 'active fw-bold bg-white text-primary border-bottom-white' : 'bg-primary text-white border-primary border-bottom-0 opacity-75'}`}
                    onClick={() => setViewMode('plot')}
                    title="View Plot"
                    style={{ borderBottomColor: viewMode === 'plot' ? 'white' : undefined }}
                >
                    🎨 Plot
                </button>
            </li>
            <li className="nav-item">
                <button
                    className={`nav-link fs-5 px-4 py-2 rounded-top ${viewMode === 'table' ? 'active fw-bold bg-white text-primary border-bottom-white' : 'bg-primary text-white border-primary border-bottom-0 opacity-75'}`}
                    onClick={() => setViewMode('table')}
                    title="View Table"
                    style={{ borderBottomColor: viewMode === 'table' ? 'white' : undefined }}
                >
                    📇 Table
                </button>
            </li>
        </ul>
    );
};

