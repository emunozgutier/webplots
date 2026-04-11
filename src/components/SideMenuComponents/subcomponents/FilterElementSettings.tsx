import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Card, Button } from 'react-bootstrap';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useFilterSideMenuStore, type Filter } from '../../../store/SideMenu/useFilterSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';

interface FilterElementSettingsProps {
    filter: Filter;
}

const FilterElementSettings: React.FC<FilterElementSettingsProps> = ({ filter }) => {
    const { data } = useCsvDataStore();
    const { updateFilter } = useFilterSideMenuStore();
    const { closePopup } = useWorkspaceLocalStore();

    const columnData = useMemo(() => {
        return data.map(row => row[filter.column]).filter(v => typeof v === 'number') as number[];
    }, [data, filter.column]);

    const { min: currentMin, max: currentMax } = filter.config as any;

    const bounds = useMemo(() => {
        if (columnData.length === 0) return { min: 0, max: 100 };
        let min = columnData[0];
        let max = columnData[0];
        for (let i = 1; i < columnData.length; i++) {
            if (columnData[i] < min) min = columnData[i];
            if (columnData[i] > max) max = columnData[i];
        }
        return { min, max };
    }, [columnData]);

    const activeMin = currentMin ?? bounds.min;
    const activeMax = currentMax ?? bounds.max;

    const pointsKept = useMemo(() => {
        if (columnData.length === 0) return 0;
        const count = columnData.filter(v => v >= activeMin && v <= activeMax).length;
        return Math.round((count / columnData.length) * 100);
    }, [columnData, activeMin, activeMax]);

    const handleRelayout = (event: any) => {
        // Plotly relayOut events for shapes
        let newMin = activeMin;
        let newMax = activeMax;
        let changed = false;

        // Extract shape changes
        for (const key in event) {
            if (key.startsWith('shapes[0]')) {
                newMin = event[key];
                changed = true;
            } else if (key.startsWith('shapes[1]')) {
                newMax = event[key];
                changed = true;
            }
        }

        if (changed) {
            // Constrain to bounds
            newMin = Math.max(bounds.min, Math.min(bounds.max, newMin));
            newMax = Math.max(bounds.min, Math.min(bounds.max, newMax));
            
            // Ensure min <= max
            if (newMin > newMax) {
                const temp = newMin;
                newMin = newMax;
                newMax = temp;
            }

            updateFilter(filter.id, { min: newMin, max: newMax });
        }
    };

    return (
        <Card className="shadow-lg border-0 h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-2">
                <h6 className="mb-0 fw-bold">
                    <i className="bi bi-funnel-fill me-2"></i>
                    Filtering: {filter.column}
                </h6>
                <Button variant="link" className="text-white p-0" onClick={closePopup}>
                    <i className="bi bi-x-lg"></i>
                </Button>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column">
                <div className="text-center mb-3 p-2 bg-light rounded border">
                    <span className="small text-muted d-block mb-1">Data Retention</span>
                    <h4 className="mb-0 text-primary fw-bold">{pointsKept}%</h4>
                    <small className="text-muted">of total points kept with current range</small>
                </div>

                <div className="flex-grow-1 border rounded bg-white overflow-hidden" style={{ minHeight: '300px' }}>
                    <Plot
                        data={[
                            {
                                x: columnData,
                                type: 'histogram',
                                nbinsx: 30,
                                marker: { color: 'rgba(13, 110, 253, 0.6)' },
                                hoverinfo: 'y',
                                name: 'Distribution'
                            } as any
                        ]}
                        layout={{
                            autosize: true,
                            margin: { l: 40, r: 20, t: 30, b: 40 },
                            xaxis: { title: { text: 'Value' } as any, fixedrange: true },
                            yaxis: { title: { text: 'Frequency' } as any, fixedrange: true },
                            template: { layout: { } } as any,
                            shapes: [
                                {
                                    type: 'line',
                                    xref: 'x',
                                    yref: 'paper',
                                    x0: activeMin,
                                    x1: activeMin,
                                    y0: 0,
                                    y1: 1,
                                    line: { color: 'red', width: 3, dash: 'dash' },
                                    name: 'Min Bound'
                                } as any,
                                {
                                    type: 'line',
                                    xref: 'x',
                                    yref: 'paper',
                                    x0: activeMax,
                                    x1: activeMax,
                                    y0: 0,
                                    y1: 1,
                                    line: { color: 'red', width: 3, dash: 'dash' },
                                    name: 'Max Bound'
                                } as any
                            ]
                        }}
                        config={{
                            displayModeBar: false,
                            responsive: true,
                            editable: true,
                            edits: {
                                shapePosition: true
                            }
                        }}
                        onRelayout={handleRelayout}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                <div className="mt-3 d-flex justify-content-between gap-3">
                    <div className="flex-grow-1">
                        <label className="small text-muted fw-bold mb-1">Min Limit</label>
                        <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            value={activeMin} 
                            onChange={(e) => updateFilter(filter.id, { min: Number(e.target.value) })}
                        />
                    </div>
                    <div className="flex-grow-1">
                        <label className="small text-muted fw-bold mb-1">Max Limit</label>
                        <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            value={activeMax} 
                            onChange={(e) => updateFilter(filter.id, { max: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <Button variant="primary" className="mt-4 w-100 fw-bold rounded-pill shadow-sm" onClick={closePopup}>
                    Apply Selection
                </Button>
            </Card.Body>
        </Card>
    );
};

export default FilterElementSettings;
