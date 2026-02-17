
import React from 'react';
import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';

interface PlotAreaProps {
    data: Data[];
    xAxis: string;
    yAxis: string;
    hasData: boolean;
}

const PlotArea: React.FC<PlotAreaProps> = ({
    data,
    xAxis,
    yAxis,
    hasData
}) => {
    return (
        <div className="col-md-9 col-lg-10 p-4">
            <div className="card h-100 shadow-sm">
                <div className="card-body p-0 position-relative">
                    {hasData ? (
                        <Plot
                            data={data}
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
                            <p>Please upload a CSV file from the sidebar to generate a plot.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlotArea;
