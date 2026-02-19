import React, { useState } from 'react';
import { useTraceConfigStore } from '../../../store/TraceConfigStore';
import { useAxisSideMenuStore } from '../../../store/AxisSideMenuStore';
import { useAppStateStore } from '../../../store/AppStateStore';
import { COLOR_PALETTES } from '../../../utils/ColorPalettes';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { HexColorPicker } from 'react-colorful';
import { OverlayTrigger, Popover, Dropdown, Tabs, Tab, ButtonGroup, ToggleButton } from 'react-bootstrap';

const SYMBOLS = [
    { id: 'circle', label: 'Circle', icon: 'bi-circle-fill' },
    { id: 'square', label: 'Square', icon: 'bi-square-fill' },
    { id: 'diamond', label: 'Diamond', icon: 'bi-diamond-fill' },
    { id: 'cross', label: 'Cross', icon: 'bi-plus-lg' },
    { id: 'x', label: 'X', icon: 'bi-x-lg' },
    { id: 'triangle-up', label: 'Triangle', icon: 'bi-triangle-fill' },
    { id: 'star', label: 'Star', icon: 'bi-star-fill' }
];

const TraceConfig: React.FC = () => {
    const { traceConfig, setTraceCustomization, setColorPalette, setPaletteColorOrder, updatePaletteColor } = useTraceConfigStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { closePopup } = useAppStateStore();

    // Manage active tab locally
    const [activeTab, setActiveTab] = useState<string>(sideMenuData.yAxis[0] || '');

    // If active tab is not in yAxis anymore, reset to first
    React.useEffect(() => {
        if (sideMenuData.yAxis.length > 0 && !sideMenuData.yAxis.includes(activeTab)) {
            setActiveTab(sideMenuData.yAxis[0]);
        }
    }, [sideMenuData.yAxis, activeTab]);

    const currentColors = traceConfig.currentPaletteColors || [];
    const activeTraceCount = sideMenuData.yAxis.length;

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
                {sideMenuData.yAxis.length === 0 ? (
                    <div className="text-center text-muted p-4">No active traces selected.</div>
                ) : (
                    <Tabs activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} className="mb-3 small">
                        {sideMenuData.yAxis.map((col, index) => (
                            <Tab key={col} eventKey={col} title={<span className="text-truncate d-inline-block" style={{ maxWidth: '100px' }}>{`Trace #${index + 1}`}</span>}>
                                {(() => {
                                    const idx = sideMenuData.yAxis.indexOf(col);
                                    const custom = traceConfig.traceCustomizations?.[col] || {};
                                    const assignedColor = currentColors[idx % currentColors.length] || '#000000';
                                    const effectiveColor = custom.color || assignedColor;
                                    const currentMode = custom.mode || 'lines';
                                    const currentSymbol = custom.symbol || 'circle';

                                    return (
                                        <div className="p-2">
                                            {/* Display Name */}
                                            <div className="mb-3">
                                                <label className="form-label small fw-bold">Display Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    value={custom.displayName || ''}
                                                    placeholder={col}
                                                    onChange={(e) => handleTraceChange(col, 'displayName', e.target.value)}
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
                                                            onChange={(e) => handleTraceChange(col, 'color', e.target.value)}
                                                            title="Override Color"
                                                        />
                                                        <span className="small text-muted">{effectiveColor}</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small fw-bold">Plot Type</label>
                                                    <ButtonGroup size="sm" className="w-100">
                                                        <ToggleButton
                                                            id={`mode-line-${col}`}
                                                            type="radio"
                                                            variant="outline-secondary"
                                                            name={`mode-${col}`}
                                                            value="lines"
                                                            checked={currentMode === 'lines'}
                                                            onChange={() => handleModeChange(col, 'lines')}
                                                        >
                                                            Line
                                                        </ToggleButton>
                                                        <ToggleButton
                                                            id={`mode-markers-${col}`}
                                                            type="radio"
                                                            variant="outline-secondary"
                                                            name={`mode-${col}`}
                                                            value="markers"
                                                            checked={currentMode === 'markers'}
                                                            onChange={() => handleModeChange(col, 'markers')}
                                                        >
                                                            Scatter
                                                        </ToggleButton>
                                                    </ButtonGroup>
                                                </div>
                                            </div>

                                            {/* Symbol Picker (Only for Scatter) */}
                                            {currentMode === 'markers' && (
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Marker Symbol</label>
                                                    <div className="d-flex flex-wrap gap-2 border p-2 rounded bg-light">
                                                        {SYMBOLS.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                className={`btn btn-sm ${currentSymbol === s.id ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center justify-content-center`}
                                                                style={{ width: '36px', height: '36px' }}
                                                                onClick={() => handleSymbolChange(col, s.id)}
                                                                title={s.label}
                                                            >
                                                                <i className={`bi ${s.icon}`}></i>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Size Slider (Only for markers or lines+markers if symbol selected) */}
                                            {(currentMode === 'markers' || custom.symbol) && (
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold d-flex justify-content-between">
                                                        <span>Marker Size</span>
                                                        <span className="text-muted">{custom.size || 8}px</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        className="form-range"
                                                        min="4"
                                                        max="20"
                                                        step="1"
                                                        value={custom.size || 8}
                                                        onChange={(e) => handleSizeChange(col, parseInt(e.target.value))}
                                                    />
                                                </div>
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
