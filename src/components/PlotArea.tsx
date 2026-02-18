import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { usePlotDataStore } from '../store/PlotDataStore';
import { useSideMenuStore } from '../store/SideMenuStore';
import { usePlotLayoutStore } from '../store/PlotLayoutStore';
import { generatePlotConfig } from '../utils/PlotlyHelpers';
import ControllerButtons from './PlotAreaComponents/ControllerButtons';
import Settings from './PlotAreaComponents/Settings';
import Debug from './PlotAreaComponents/Debug';

const PlotArea: React.FC = () => {
    const { data } = usePlotDataStore();
    const { sideMenuData, isMenuOpen } = useSideMenuStore();
    const { plotLayout } = usePlotLayoutStore();

    const { plotData, layout, hasData, receipt } = useMemo(() => generatePlotConfig(data, sideMenuData, plotLayout), [data, sideMenuData, plotLayout]);

    // Force Plotly resize when side menu toggles
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300); // Wait for transition to finish
        return () => clearTimeout(timer);
    }, [isMenuOpen]);

    return (
        <div className="flex-grow-1 p-4 d-flex flex-column position-relative" style={{ minWidth: 0 }}>
            <div className="card shadow-sm flex-grow-1 mb-3">
                <div className="card-header bg-white d-flex justify-content-end align-items-center py-2">
                    <ControllerButtons />
                </div>
                <div className="card-body p-0 position-relative">
                    {hasData ? (
                        <Plot
                            data={plotData}
                            layout={layout}
                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                            className="w-100 h-100"
                        />
                    ) : (
                        <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                            <div className="display-1 mb-3">📊</div>
                            <h4>No Data Loaded</h4>
                            <p>Please load a CSV file or Project from the <strong>File</strong> menu to generate a plot.</p>
                        </div>
                    )}
                </div>
            </div>

            <Debug receipt={receipt || ''} />
            <Settings />
        </div>
    );
};

export default PlotArea;
