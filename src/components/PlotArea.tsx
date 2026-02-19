import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useCsvDataStore } from '../store/CsvDataStore';
import { useSideMenuStore } from '../store/SideMenuStore';
import { useAppStateStore } from '../store/AppStateStore';
import { usePlotLayoutStore } from '../store/PlotLayoutStore';
import { useTraceConfigStore } from '../store/TraceConfigStore';
import { generatePlotConfig } from '../utils/PlotlyHelpers';
import ControllerButtons from './PlotAreaComponents/ControllerButtons';
import Settings from './PlotAreaComponents/Settings';
import Debug from './PlotAreaComponents/Debug';

import { useFilteredData } from '../hooks/useFilteredData';

const PlotArea: React.FC = () => {
    const data = useFilteredData();
    const { sideMenuData } = useSideMenuStore();
    const { isSideMenuOpen } = useAppStateStore();
    const { plotLayout } = usePlotLayoutStore();
    const { traceConfig } = useTraceConfigStore();

    const { plotData, layout, hasData, receipt } = useMemo(() => generatePlotConfig(data, sideMenuData, plotLayout, traceConfig), [data, sideMenuData, plotLayout, traceConfig]);

    // Force Plotly resize when side menu toggles
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300); // Wait for transition to finish
        return () => clearTimeout(timer);
    }, [isSideMenuOpen]);

    const { setPopupContent } = useAppStateStore();

    const handleOpenSettings = () => {
        setPopupContent(<Settings />);
    };

    const handleOpenDebug = () => {
        // We pass receipt here. Debug component uses it.
        // Wait, receipt comes from useMemo above.
        setPopupContent(<Debug receipt={receipt || ''} />);
    };

    return (
        <div className="flex-grow-1 p-4 d-flex flex-column position-relative" style={{ minWidth: 0 }}>
            <div className="card shadow-sm flex-grow-1 mb-3">
                <div className="card-header bg-white d-flex justify-content-end align-items-center py-2">
                    <ControllerButtons onOpenSettings={handleOpenSettings} onOpenDebug={handleOpenDebug} />
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
        </div>
    );
};

export default PlotArea;
