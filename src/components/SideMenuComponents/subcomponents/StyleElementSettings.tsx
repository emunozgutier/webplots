import React from 'react';
import Plot from 'react-plotly.js';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import type { StyleElementProps } from './StyleElement';

const StyleElementSettings: React.FC<StyleElementProps> = ({ title, mapping, updateFn, type }) => {
    const { closePopup } = useWorkspaceLocalStore();
    const { data } = useCsvDataStore();

    if (type !== 'number' || typeof mapping.value !== 'string') {
        return null;
    }

    const vals = data.map((row: any) => parseFloat(String(row[mapping.value]))).filter((v: number) => !isNaN(v));
    const min = vals.length > 0 ? Math.min(...vals) : 0;
    const max = vals.length > 0 ? Math.max(...vals) : 0;

    return (
        <div className="card shadow w-100 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fs-6">Adjust Range for {title}</h5>
                <button className="btn-close" onClick={closePopup}></button>
            </div>
            <div className="card-body p-3 overflow-auto">
                <label className="form-label small text-muted mb-1 d-flex justify-content-between">
                    <span>Output Range (Min-Max)</span>
                </label>
                <div className="d-flex align-items-center gap-2 mb-3">
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        value={mapping.range ? mapping.range[0] : (title === 'Node Size' ? 2 : 0)}
                        onChange={e => updateFn({ range: [Number(e.target.value), mapping.range ? mapping.range[1] : (title === 'Hue/Color' ? 360 : (title === 'Node Size' ? 20 : 100))] })}
                    />
                    <span className="text-muted small">to</span>
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        value={mapping.range ? mapping.range[1] : (title === 'Hue/Color' ? 360 : (title === 'Node Size' ? 20 : 100))}
                        onChange={e => updateFn({ range: [mapping.range ? mapping.range[0] : (title === 'Node Size' ? 2 : 0), Number(e.target.value)] })}
                    />
                </div>
                <div className="border rounded bg-light p-1" style={{ height: '150px' }}>
                    <Plot
                        data={[
                            {
                                x: vals,
                                type: 'histogram',
                                marker: { color: title === 'Hue/Color' ? 'hsl(200, 80%, 50%)' : '#6c757d' }
                            }
                        ]}
                        layout={{
                            margin: { t: 5, r: 5, l: 30, b: 20 },
                            xaxis: { fixedrange: true },
                            yaxis: { fixedrange: true },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent'
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                        useResizeHandler={true}
                    />
                </div>
                <div className="d-flex justify-content-between text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                    <span>Data Min: {min.toFixed(2)}</span>
                    <span>Data Max: {max.toFixed(2)}</span>
                </div>
            </div>
            <div className="card-footer text-end p-2">
                <button className="btn btn-secondary btn-sm" onClick={closePopup}>
                    Close
                </button>
            </div>
        </div>
    );
};

export default StyleElementSettings;
