
import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import type { Data } from 'plotly.js';

interface PlotData {
    [key: string]: string | number;
}

const CsvPlotter: React.FC = () => {
    const [data, setData] = useState<PlotData[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [xAxis, setXAxis] = useState<string>('');
    const [yAxis, setYAxis] = useState<string>('');

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const parsedData = results.data as PlotData[];
                    if (parsedData.length > 0) {
                        setData(parsedData);
                        const cols = Object.keys(parsedData[0]);
                        setColumns(cols);
                        // Default to first two columns if available
                        if (cols.length > 0) setXAxis(cols[0]);
                        if (cols.length > 1) setYAxis(cols[1]);
                    }
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }
    };

    const getPlotData = (): Data[] => {
        if (!data.length || !xAxis || !yAxis) return [];

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
        <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
            {/* Sidebar */}
            <div style={{
                width: '300px',
                padding: '20px',
                borderRight: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                backgroundColor: '#f5f5f5'
            }}>
                <h2>Data Settings</h2>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Upload CSV File
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ width: '100%' }}
                    />
                </div>

                {columns.length > 0 && (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                X-Axis Column
                            </label>
                            <select
                                value={xAxis}
                                onChange={(e) => setXAxis(e.target.value)}
                                style={{ width: '100%', padding: '5px' }}
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Y-Axis Column
                            </label>
                            <select
                                value={yAxis}
                                onChange={(e) => setYAxis(e.target.value)}
                                style={{ width: '100%', padding: '5px' }}
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* Main Plot Area */}
            <div style={{ flex: 1, padding: '20px' }}>
                {data.length > 0 ? (
                    <Plot
                        data={getPlotData()}
                        layout={{
                            width: undefined,
                            height: undefined,
                            title: { text: `Plot: ${yAxis} vs ${xAxis}` },
                            xaxis: { title: { text: xAxis } },
                            yaxis: { title: { text: yAxis } },
                            autosize: true
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: '#666'
                    }}>
                        Please upload a CSV file to generate a plot
                    </div>
                )}
            </div>
        </div>
    );
};

export default CsvPlotter;
