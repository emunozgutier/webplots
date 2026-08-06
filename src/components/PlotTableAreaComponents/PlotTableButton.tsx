import React from 'react';

interface PlotTableButtonProps {
    viewMode: 'plot' | 'table';
    setViewMode: (mode: 'plot' | 'table') => void;
}

export const PlotTableButton: React.FC<PlotTableButtonProps> = ({ viewMode, setViewMode }) => {
    const isPlot = viewMode === 'plot';

    return (
        <div 
            id="plot-table-toggle-switch"
            className="PlotTableSwitch"
            onClick={() => setViewMode(isPlot ? 'table' : 'plot')}
            title={isPlot ? 'Switch to Table View' : 'Switch to Plot View'}
        >
            <div 
                className="PlotTableSwitch-thumb" 
                style={{ left: isPlot ? '3px' : '50%' }}
            />
            <div className={`PlotTableSwitch-option ${isPlot ? 'active' : ''}`}>
                Plot
            </div>
            <div className={`PlotTableSwitch-option ${!isPlot ? 'active' : ''}`}>
                Table
            </div>
        </div>
    );
};
