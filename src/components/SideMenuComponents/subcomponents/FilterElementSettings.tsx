import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Card, Button } from 'react-bootstrap';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useFilterSideMenuStore, type Filter } from '../../../store/SideMenu/useFilterSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';

interface FilterElementSettingsProps {
    filter: Filter;
}

const FilterElementSettings: React.FC<FilterElementSettingsProps> = ({ filter: initialFilter }) => {
    const { data } = useCsvDataStore();
    const filters = useFilterSideMenuStore(state => state.filters);
    const updateFilter = useFilterSideMenuStore(state => state.updateFilter);
    const { closePopup } = useWorkspaceLocalStore();

    // Derive the reactive filter from the store so it updates when dragging sliders
    const filter = filters.find(f => f.id === initialFilter.id) || initialFilter;

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

    const [localTextMin, setLocalTextMin] = React.useState<string | number>(Math.round(activeMin * 100) / 100);
    const [localTextMax, setLocalTextMax] = React.useState<string | number>(Math.round(activeMax * 100) / 100);

    React.useEffect(() => {
        setLocalTextMin(Math.round(activeMin * 100) / 100);
        setLocalTextMax(Math.round(activeMax * 100) / 100);
    }, [activeMin, activeMax]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            const numVal = Number(localTextMin);
            if (localTextMin !== '' && !isNaN(numVal) && numVal !== Math.round(activeMin * 100) / 100) {
                updateFilter(filter.id, { min: numVal });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localTextMin, activeMin, filter.id, updateFilter]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            const numVal = Number(localTextMax);
            if (localTextMax !== '' && !isNaN(numVal) && numVal !== Math.round(activeMax * 100) / 100) {
                updateFilter(filter.id, { max: numVal });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localTextMax, activeMax, filter.id, updateFilter]);

    const handleRelayout = (event: any) => {
        // Handle dragging the edges of the grey-out rectangles
        let newMin = activeMin;
        let newMax = activeMax;
        let changed = false;

        for (const key in event) {
            if (key.startsWith('shapes[0].x1')) {
                newMin = event[key];
                changed = true;
            } else if (key.startsWith('shapes[1].x0')) {
                newMax = event[key];
                changed = true;
            }
        }

        if (changed) {
            newMin = Math.max(bounds.min, Math.min(bounds.max, newMin));
            newMax = Math.max(bounds.min, Math.min(bounds.max, newMax));
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

                <div className="flex-grow-1 border rounded bg-white overflow-hidden mb-3" style={{ minHeight: '250px' }}>
                    <Plot
                        data={[
                            {
                                x: columnData,
                                type: 'histogram',
                                nbinsx: 30,
                                marker: { color: 'rgba(13, 110, 253, 0.7)' },
                                hoverinfo: 'y',
                                name: 'Distribution'
                            } as any
                        ]}
                        layout={{
                            autosize: true,
                            title: { text: null } as any,
                            margin: { l: 40, r: 20, t: 10, b: 20 },
                            xaxis: { 
                                title: { text: null } as any, 
                                fixedrange: true,
                                range: [bounds.min, bounds.max]
                            },
                            yaxis: { 
                                title: { text: null } as any, 
                                fixedrange: true 
                            },
                            template: { layout: { margin: { t: 0, b: 0, l: 0, r: 0 } } } as any,
                            shapes: [
                                // Left grey-out (draggable right edge)
                                {
                                    type: 'rect',
                                    xref: 'x',
                                    yref: 'paper',
                                    x0: bounds.min,
                                    x1: activeMin,
                                    y0: 0,
                                    y1: 1,
                                    fillcolor: 'rgba(100, 100, 100, 0.4)',
                                    line: { width: 0 },
                                    layer: 'above'
                                } as any,
                                // Right grey-out (draggable left edge)
                                {
                                    type: 'rect',
                                    xref: 'x',
                                    yref: 'paper',
                                    x0: activeMax,
                                    x1: bounds.max,
                                    y0: 0,
                                    y1: 1,
                                    fillcolor: 'rgba(100, 100, 100, 0.4)',
                                    line: { width: 0 },
                                    layer: 'above'
                                } as any
                            ]
                        }}
                        config={{
                            displayModeBar: false,
                            responsive: true,
                            editable: false,
                            edits: {
                                shapePosition: true,
                                annotationPosition: false,
                                annotationText: false,
                                axisTitleText: false,
                                titleText: false
                            } as any
                        }}
                        onRelayout={handleRelayout}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                {/* Double Slider UI */}
                <div className="px-4 py-3 bg-light rounded-3 mb-3 border shadow-sm">
                    <div className="position-relative" style={{ height: '40px', padding: '10px 0' }}>
                        {/* Track */}
                        <div 
                            className="position-absolute w-100 bg-secondary bg-opacity-25" 
                            style={{ height: '8px', top: '16px', borderRadius: '4px' }}
                        />
                        {/* Active Area */}
                        <div 
                            className="position-absolute bg-primary" 
                            style={{ 
                                height: '8px', 
                                top: '16px', 
                                borderRadius: '4px',
                                left: `${((activeMin - bounds.min) / (bounds.max - bounds.min)) * 100}%`,
                                right: `${100 - ((activeMax - bounds.min) / (bounds.max - bounds.min)) * 100}%`
                            }}
                        />
                        {/* Range Inputs */}
                        <input
                            type="range"
                            min={bounds.min}
                            max={bounds.max}
                            step={(bounds.max - bounds.min) / 1000}
                            value={activeMin}
                            onChange={(e) => {
                                const val = Math.min(activeMax, Number(e.target.value));
                                updateFilter(filter.id, { min: val, max: activeMax });
                            }}
                            className="custom-range-slider"
                            style={{ zIndex: 20 }}
                        />
                        <input
                            type="range"
                            min={bounds.min}
                            max={bounds.max}
                            step={(bounds.max - bounds.min) / 1000}
                            value={activeMax}
                            onChange={(e) => {
                                const val = Math.max(activeMin, Number(e.target.value));
                                updateFilter(filter.id, { min: activeMin, max: val });
                            }}
                            className="custom-range-slider"
                            style={{ zIndex: 21 }}
                        />
                        <style>{`
                            .custom-range-slider {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 100%;
                                position: absolute;
                                top: 5px;
                                left: 0;
                                height: 30px;
                                background: transparent;
                                pointer-events: none;
                                margin: 0;
                                padding: 0;
                            }
                            .custom-range-slider:focus {
                                outline: none;
                            }
                            .custom-range-slider::-webkit-slider-runnable-track {
                                width: 100%;
                                height: 100%;
                                background: transparent;
                                border: none;
                            }
                            .custom-range-slider::-moz-range-track {
                                width: 100%;
                                height: 100%;
                                background: transparent;
                                border: none;
                            }
                            .custom-range-slider::-webkit-slider-thumb {
                                pointer-events: auto;
                                cursor: pointer;
                                -webkit-appearance: none;
                                height: 24px;
                                width: 24px;
                                border-radius: 50%;
                                background: #0d6efd;
                                border: 3px solid white;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                                margin-top: 3px;
                            }
                            .custom-range-slider::-moz-range-thumb {
                                pointer-events: auto;
                                cursor: pointer;
                                height: 24px;
                                width: 24px;
                                border-radius: 50%;
                                background: #0d6efd;
                                border: 3px solid white;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                            }
                        `}</style>
                    </div>
                </div>

                <div className="d-flex justify-content-between gap-3 mb-3">
                    <div className="flex-grow-1">
                        <label className="small text-muted fw-bold mb-1">Min Limit</label>
                        <input 
                            type="number" 
                            className="form-control form-control-sm border-primary border-opacity-25" 
                            value={localTextMin} 
                            onChange={(e) => setLocalTextMin(e.target.value)}
                        />
                    </div>
                    <div className="flex-grow-1">
                        <label className="small text-muted fw-bold mb-1">Max Limit</label>
                        <input 
                            type="number" 
                            className="form-control form-control-sm border-primary border-opacity-25" 
                            value={localTextMax} 
                            onChange={(e) => setLocalTextMax(e.target.value)}
                        />
                    </div>
                </div>

                <Button variant="primary" className="mt-auto w-100 fw-bold rounded-pill shadow-sm py-2" onClick={closePopup}>
                    Apply Selection
                </Button>
            </Card.Body>
        </Card>
    );
};

export default FilterElementSettings;
