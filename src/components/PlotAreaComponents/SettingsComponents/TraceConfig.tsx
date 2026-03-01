import React, { useState } from 'react';
import { useTraceConfigStore } from '../../../store/TraceConfigStore';
import { useAxisSideMenuStore } from '../../../store/AxisSideMenuStore';
import { useAppStateStore } from '../../../store/AppStateStore';
import { COLOR_PALETTES } from '../../../utils/ColorPalettes';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { HexColorPicker } from 'react-colorful';
import { OverlayTrigger, Popover, Dropdown, Tabs, Tab, ButtonGroup, ToggleButton } from 'react-bootstrap';
import { useCsvDataStore } from '../../../store/CsvDataStore';
import Plot from 'react-plotly.js';

const SYMBOLS = [
    { id: 'circle', label: 'Circle', icon: 'bi-circle-fill' },
    { id: 'square', label: 'Square', icon: 'bi-square-fill' },
    { id: 'diamond', label: 'Diamond', icon: 'bi-diamond-fill' },
    { id: 'cross', label: 'Cross', icon: 'bi-plus-lg' },
    { id: 'x', label: 'X', icon: 'bi-x-lg' },
    { id: 'triangle-up', label: 'Triangle', icon: 'bi-triangle-fill' },
    { id: 'star', label: 'Star', icon: 'bi-star-fill' }
];

const HistogramBinSettings: React.FC<{ col: string; custom: any; data: any[]; setTraceCustomization: any }> = ({ col, custom, data, setTraceCustomization }) => {
    // Memoize the data bounds so we can display them and use them for defaults
    const { dataMin, dataMax } = React.useMemo(() => {
        let min = Infinity, max = -Infinity;
        if (data && data.length > 0) {
            data.forEach(row => {
                const val = parseFloat(String(row[col]));
                if (!isNaN(val)) {
                    if (val < min) min = val;
                    if (val > max) max = val;
                }
            });
        }
        if (min === Infinity) { min = 0; max = 100; }
        return { dataMin: min, dataMax: max };
    }, [data, col]);

    React.useEffect(() => {
        if (!custom.histogramBins && data && data.length > 0) {
            const start = Math.floor(dataMin);
            const end = Math.ceil(dataMax);
            // Default to ~10 bins
            const size = (end - start) / 10 || 1;

            setTraceCustomization(col, {
                histogramBins: {
                    start,
                    end,
                    size,
                    binMode: 'width',
                    count: 10,
                    underflow: true,
                    overflow: true
                }
            });
        }
    }, [col, custom.histogramBins, data, setTraceCustomization]);

    if (!custom.histogramBins) return null;

    const bins = custom.histogramBins;
    // Calculate bin count if not set
    const currentMode = bins.binMode || 'width';
    const activeCount = bins.count || Math.max(1, Math.round((bins.end - bins.start) / bins.size));

    const updateBin = (field: string, value: any) => {
        const newBins = { ...bins, [field]: value };

        // If we are updating start or end, and we are in 'count' mode, recalculate size
        if (currentMode === 'count' && (field === 'start' || field === 'end')) {
            const range = newBins.end - newBins.start;
            newBins.size = range / activeCount;
        }

        setTraceCustomization(col, { histogramBins: newBins });
    };

    const updateMode = (mode: 'width' | 'count') => {
        setTraceCustomization(col, {
            histogramBins: { ...bins, binMode: mode }
        });
    };

    const updateCount = (newCount: number) => {
        if (newCount > 0) {
            const newSize = (bins.end - bins.start) / newCount;
            setTraceCustomization(col, {
                histogramBins: { ...bins, count: newCount, size: newSize, binMode: 'count' }
            });
        }
    };

    return (
        <div className="mb-3">
            <hr />
            <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
                <label className="form-label small fw-bold mb-0">Histogram Bins</label>
                <ButtonGroup size="sm">
                    <ToggleButton
                        id={`binmode-width-${col}`}
                        type="radio"
                        variant="outline-secondary"
                        name={`binmode-${col}`}
                        value="width"
                        checked={currentMode === 'width'}
                        onChange={() => updateMode('width')}
                    >
                        Bin Width
                    </ToggleButton>
                    <ToggleButton
                        id={`binmode-count-${col}`}
                        type="radio"
                        variant="outline-secondary"
                        name={`binmode-${col}`}
                        value="count"
                        checked={currentMode === 'count'}
                        onChange={() => updateMode('count')}
                    >
                        Number of Bins
                    </ToggleButton>
                </ButtonGroup>
            </div>

            <div className="row g-2 mb-2">
                <div className="col-4">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">Start</span>
                        <input type="number" className="form-control" value={Number(bins.start.toFixed(2))} onChange={e => updateBin('start', parseFloat(e.target.value))} />
                    </div>
                    <div className="text-muted text-start ps-1 mt-1" style={{ fontSize: '0.65rem' }}>Data Min: {dataMin.toFixed(2)}</div>
                </div>
                <div className="col-4">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">End</span>
                        <input type="number" className="form-control" value={Number(bins.end.toFixed(2))} onChange={e => updateBin('end', parseFloat(e.target.value))} />
                    </div>
                    <div className="text-muted text-start ps-1 mt-1" style={{ fontSize: '0.65rem' }}>Data Max: {dataMax.toFixed(2)}</div>
                </div>
                {currentMode === 'width' ? (
                    <div className="col-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">Width</span>
                            <input type="number" className="form-control" value={Number(bins.size.toFixed(2))} onChange={e => updateBin('size', parseFloat(e.target.value))} step="0.1" />
                        </div>
                    </div>
                ) : (
                    <div className="col-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">Count</span>
                            <input type="number" className="form-control" value={activeCount} onChange={e => updateCount(parseInt(e.target.value))} min="1" />
                        </div>
                    </div>
                )}
            </div>
            <div className="d-flex gap-3 mb-3">
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id={`flexSwitchUnderflow-${col}`} checked={bins.underflow} onChange={e => updateBin('underflow', e.target.checked)} />
                    <label className="form-check-label small" htmlFor={`flexSwitchUnderflow-${col}`}>Underflow Bin</label>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id={`flexSwitchOverflow-${col}`} checked={bins.overflow} onChange={e => updateBin('overflow', e.target.checked)} />
                    <label className="form-check-label small" htmlFor={`flexSwitchOverflow-${col}`}>Overflow Bin</label>
                </div>
            </div>

            <div className="border rounded bg-white p-2" style={{ height: '200px' }}>
                <Plot
                    data={[
                        {
                            x: data.map(row => {
                                let num = parseFloat(String(row[col]));
                                if (isNaN(num)) return num;
                                if (bins.underflow && num < bins.start) num = bins.start + 1e-6;
                                if (bins.overflow && num > bins.end) num = bins.end - 1e-6;
                                return num;
                            }),
                            type: 'histogram',
                            marker: { color: custom.color || '#0d6efd' },
                            autobinx: false,
                            xbins: {
                                start: bins.start,
                                end: bins.end,
                                size: bins.size
                            }
                        }
                    ]}
                    layout={{
                        margin: { t: 10, r: 10, l: 30, b: 30 },
                        xaxis: { range: [bins.start, bins.end], fixedrange: true },
                        yaxis: { fixedrange: true },
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent'
                    }}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                />
            </div>
        </div >
    );
};

const TraceConfig: React.FC = () => {
    const { traceConfig, setTraceCustomization, setColorPalette, setPaletteColorOrder, updatePaletteColor } = useTraceConfigStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { closePopup } = useAppStateStore();
    const { data } = useCsvDataStore();

    const activeTraces = traceConfig.activeTraces || [];

    // Manage active tab locally
    const [activeTab, setActiveTab] = useState<string>(activeTraces[0]?.fullTraceName || '');

    // If active tab is not in activeTraces anymore, reset to first
    React.useEffect(() => {
        if (activeTraces.length > 0 && !activeTraces.find(t => t.fullTraceName === activeTab)) {
            setActiveTab(activeTraces[0].fullTraceName);
        }
    }, [activeTraces, activeTab]);

    const currentColors = traceConfig.currentPaletteColors || [];
    const activeTraceCount = activeTraces.length;

    const handleTraceChange = (column: string, field: 'displayName' | 'color', value: string) => {
        setTraceCustomization(column, { [field]: value });
    };

    const handleModeChange = (column: string, mode: 'lines' | 'markers') => {
        setTraceCustomization(column, { mode });
    };

    const handleSymbolChange = (column: string, symbol: string) => {
        setTraceCustomization(column, { symbol });
    };

    const handleSizeChange = (column: string, size: number) => {
        setTraceCustomization(column, { size });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(currentColors);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setPaletteColorOrder(items);
    };

    const renderColorPicker = (color: string, index: number) => (
        <Popover id={`popover-color-${index}`}>
            <Popover.Body>
                <HexColorPicker color={color} onChange={(newColor) => updatePaletteColor(index, newColor)} />
            </Popover.Body>
        </Popover>
    );

    return (
        <>
            <div className="card-body overflow-auto" style={{ maxHeight: '600px' }}>
                {/* Global Palette Settings */}
                <div className="mb-4">
                    <label className="form-label small fw-bold">Color Palette</label>
                    <div className="d-flex mb-2">
                        <Dropdown onSelect={(eventKey) => eventKey && setColorPalette(eventKey)} className="me-2 flex-grow-1">
                            <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 d-flex justify-content-between align-items-center">
                                {traceConfig.colorPalette || 'Default'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100 shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {Object.keys(COLOR_PALETTES).map(paletteName => (
                                    <Dropdown.Item key={paletteName} eventKey={paletteName} active={traceConfig.colorPalette === paletteName}>
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span>{paletteName}</span>
                                            <div className="d-flex ms-2">
                                                {COLOR_PALETTES[paletteName].slice(0, 5).map((c, i) => (
                                                    <div key={i} style={{ width: '12px', height: '12px', backgroundColor: c, marginRight: '1px' }} />
                                                ))}
                                            </div>
                                        </div>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>

                    {/* Palette Drag Strip */}
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="palette-colors" direction="horizontal">
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`d-flex align-items-center p-2 rounded border ${snapshot.isDraggingOver ? 'bg-light' : 'bg-white'}`}
                                    style={{ minHeight: '60px', position: 'relative' }}
                                >
                                    <div
                                        className="position-absolute border border-primary border-2 rounded"
                                        style={{
                                            left: '4px', top: '4px', bottom: '4px',
                                            width: `${Math.min(activeTraceCount, currentColors.length) * 48}px`,
                                            pointerEvents: 'none', zIndex: 0, backgroundColor: 'rgba(13, 110, 253, 0.05)'
                                        }}
                                    ></div>
                                    {currentColors.map((color, index) => (
                                        <Draggable key={`${index}-${color}`} draggableId={`${index}-${color}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="m-1 position-relative"
                                                    style={{ ...provided.draggableProps.style, zIndex: snapshot.isDragging ? 1000 : 1 }}
                                                >
                                                    <OverlayTrigger trigger="click" placement="bottom" overlay={renderColorPicker(color, index)} rootClose>
                                                        <div
                                                            className="rounded-circle shadow-sm border"
                                                            style={{ width: '40px', height: '40px', backgroundColor: color, cursor: 'grab' }}
                                                            title={`Color ${index + 1}`}
                                                        />
                                                    </OverlayTrigger>
                                                    {index < activeTraceCount && (
                                                        <div className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ fontSize: '0.6rem' }}>
                                                            {index + 1}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                <hr />

                {/* Individual Trace Configuration Tabs */}
                {activeTraces.length === 0 ? (
                    <div className="text-center text-muted p-4">No active traces selected.</div>
                ) : (
                    <Tabs activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} className="mb-3 small">
                        {activeTraces.map((trace, index) => (
                            <Tab key={trace.fullTraceName} eventKey={trace.fullTraceName} title={<span className="text-truncate d-inline-block" style={{ maxWidth: '100px' }}>{trace.groupName ? `Trace #${index + 1} (${trace.groupName})` : `Trace #${index + 1}`}</span>}>
                                {(() => {
                                    // Exact customization holds specific overrides (like color, explicit name override)
                                    const exactCustomization = traceConfig.traceCustomizations?.[trace.fullTraceName] || {};
                                    // Col customization holds shared parent state, esp histogram bins!
                                    const colCustomization = traceConfig.traceCustomizations?.[trace.yCol] || {};

                                    const assignedColor = currentColors[index % currentColors.length] || '#000000';
                                    const effectiveColor = exactCustomization.color || assignedColor;
                                    const currentMode = exactCustomization.mode || colCustomization.mode || 'markers';
                                    const currentSymbol = exactCustomization.symbol || colCustomization.symbol || 'circle';

                                    // Display name resolution logic mimicking PlotlyHelpers: exact > col + group > default
                                    let displayName = exactCustomization.displayName || '';
                                    if (!exactCustomization.displayName && colCustomization.displayName && trace.groupName) {
                                        displayName = `${colCustomization.displayName} (${trace.groupName})`;
                                    }

                                    return (
                                        <div className="p-2">
                                            {/* Display Name */}
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">Display Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={displayName}
                                                    placeholder={trace.fullTraceName}
                                                    onChange={(e) => handleTraceChange(trace.fullTraceName, 'displayName', e.target.value)}
                                                />
                                            </div>

                                            {/* Style & Color */}
                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <label className="form-label small fw-bold">Color Override</label>
                                                    <div className="d-flex align-items-center">
                                                        <input
                                                            type="color"
                                                            className="form-control form-control-color form-control-sm me-2"
                                                            value={effectiveColor}
                                                            onChange={(e) => handleTraceChange(trace.fullTraceName, 'color', e.target.value)}
                                                            title="Override Color"
                                                        />
                                                        <span className="small text-muted">{effectiveColor}</span>
                                                    </div>
                                                </div>
                                                {sideMenuData.plotType !== 'histogram' && (
                                                    <div className="col-6">
                                                        <label className="form-label small fw-bold">Trace Type</label>
                                                        <ButtonGroup size="sm" className="w-100">
                                                            <ToggleButton
                                                                id={`mode-line-${trace.fullTraceName}`}
                                                                type="radio"
                                                                variant="outline-secondary"
                                                                name={`mode-${trace.fullTraceName}`}
                                                                value="lines"
                                                                checked={currentMode === 'lines'}
                                                                onChange={() => handleModeChange(trace.fullTraceName, 'lines')}
                                                            >
                                                                Line
                                                            </ToggleButton>
                                                            <ToggleButton
                                                                id={`mode-markers-${trace.fullTraceName}`}
                                                                type="radio"
                                                                variant="outline-secondary"
                                                                name={`mode-${trace.fullTraceName}`}
                                                                value="markers"
                                                                checked={currentMode === 'markers'}
                                                                onChange={() => handleModeChange(trace.fullTraceName, 'markers')}
                                                            >
                                                                Scatter
                                                            </ToggleButton>
                                                        </ButtonGroup>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Symbol Picker (Only for Scatter) */}
                                            {sideMenuData.plotType !== 'histogram' && currentMode === 'markers' && (
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Marker Symbol</label>
                                                    <div className="d-flex flex-wrap gap-2 border p-2 rounded bg-light">
                                                        {SYMBOLS.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                className={`btn btn-sm ${currentSymbol === s.id ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center`}
                                                                style={{ width: '36px', height: '36px' }}
                                                                onClick={() => handleSymbolChange(trace.fullTraceName, s.id)}
                                                                title={s.label}
                                                            >
                                                                <i className={`bi ${s.icon}`}></i>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Size Slider */}
                                            {sideMenuData.plotType !== 'histogram' && (currentMode === 'markers' || exactCustomization.symbol || colCustomization.symbol) && (
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold d-flex justify-content-between">
                                                        <span>Marker Size</span>
                                                        <span className="text-muted">{exactCustomization.size || colCustomization.size || 8}px</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        className="form-range"
                                                        min="4"
                                                        max="20"
                                                        step="1"
                                                        value={exactCustomization.size || colCustomization.size || 8}
                                                        onChange={(e) => handleSizeChange(trace.fullTraceName, parseInt(e.target.value))}
                                                    />
                                                </div>
                                            )}

                                            {/* Histogram Bins (Only for Histogram plot type) */}
                                            {sideMenuData.plotType === 'histogram' && (
                                                <HistogramBinSettings
                                                    col={trace.yCol}
                                                    custom={colCustomization}
                                                    data={data}
                                                    setTraceCustomization={setTraceCustomization}
                                                />
                                            )}
                                        </div>
                                    );
                                })()}
                            </Tab>
                        ))}
                    </Tabs>
                )}
            </div>
            <div className="card-footer bg-light d-flex justify-content-end">
                <button className="btn btn-sm btn-secondary me-2" onClick={closePopup}>Close</button>
            </div>
        </>
    );
};

export default TraceConfig;
