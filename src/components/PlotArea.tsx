
import React from 'react';
import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import { useAppStore } from '../store';

const PlotArea: React.FC = () => {
    const {
        data,
        plotArea
    } = useAppStore();

    const { xAxis, yAxis } = plotArea.axisMenuData;
    const hasData = data.length > 0 && !!xAxis && !!yAxis;

    const getPlotData = (): Data[] => {
        if (!hasData) return [];

        const x = data.map(row => row[xAxis]);
        const y = data.map(row => row[yAxis]);

        return [{
            x: x,
            y: y,
            mode: 'lines',
            type: 'scatter'
        } as Data];
    };

    return (
        <div className="col-md-9 col-lg-10 p-4">
            <div className="card h-100 shadow-sm">
                <div className="card-body p-0 position-relative">
                    {hasData ? (
                        <Plot
                            data={getPlotData()}
                            layout={{
                                width: undefined,
                                height: undefined,
                                title: { text: `Plot: ${yAxis} vs ${xAxis}` },
                                xaxis: { title: { text: xAxis } },
                                yaxis: { title: { text: yAxis } },
                                autosize: true,
                                margin: { l: 50, r: 50, b: 50, t: 50 }
                            }}
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
