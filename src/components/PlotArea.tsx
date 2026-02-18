import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { usePlotDataStore } from '../store/PlotDataStore';
import { useSideMenuStore } from '../store/SideMenuStore';
import { usePlotAreaStore, createPlotConfig } from '../store/PlotAreaStore';

const PlotArea: React.FC = () => {
    const { data } = usePlotDataStore();
    const { sideMenuData } = useSideMenuStore();
    const { plotArea } = usePlotAreaStore();

    const { plotData, layout, hasData } = useMemo(() => createPlotConfig(data, sideMenuData, plotArea), [data, sideMenuData, plotArea]);

    return (
        <div className="flex-grow-1 p-4" style={{ minWidth: 0 }}>
            <div className="card h-100 shadow-sm">
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
