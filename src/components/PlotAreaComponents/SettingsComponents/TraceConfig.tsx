import React from 'react';
import { usePlotLayoutStore } from '../../../store/PlotLayoutStore';
import { useSideMenuStore } from '../../../store/SideMenuStore';
import { useAppStateStore } from '../../../store/AppStateStore';
import { COLOR_PALETTES } from '../../../utils/ColorPalettes';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { HexColorPicker } from 'react-colorful';
import { OverlayTrigger, Popover, Dropdown } from 'react-bootstrap';

const TraceConfig: React.FC = () => {
    const { plotLayout, setTraceCustomization, setColorPalette, setPaletteColorOrder, updatePaletteColor } = usePlotLayoutStore();
    const { sideMenuData } = useSideMenuStore();
    const { closePopup } = useAppStateStore();

    // Use currentPaletteColors directly from store, fallback to empty array
    const currentColors = plotLayout.currentPaletteColors || [];
    const activeTraceCount = sideMenuData.yAxis.length;

    const handleTraceChange = (column: string, field: 'displayName' | 'color', value: string) => {
        setTraceCustomization(column, { [field]: value });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

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
                <div className="mb-3">
                    <label className="form-label small fw-bold">Color Palette Base</label>
                    <Dropdown onSelect={(eventKey) => eventKey && setColorPalette(eventKey)}>
                        <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 d-flex justify-content-between align-items-center">
                            {plotLayout.colorPalette || 'Default'}
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="w-100 shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {Object.keys(COLOR_PALETTES).map(paletteName => (
                                <Dropdown.Item key={paletteName} eventKey={paletteName} active={plotLayout.colorPalette === paletteName}>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span>{paletteName}</span>
                                        <div className="d-flex ms-2">
                                            {COLOR_PALETTES[paletteName].slice(0, 5).map((c, i) => (
                                                <div
                                                    key={i}
                                                    style={{ width: '12px', height: '12px', backgroundColor: c, marginRight: '1px' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                <div className="mb-3">
                    <label className="form-label small fw-bold">Palette Ordering</label>
                    <p className="text-muted small mb-2" style={{ fontSize: '0.75rem' }}>
                        Drag/Drop colors to reorder. The active zone (blue box) shows colors assigned to your {activeTraceCount} traces.
                    </p>

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="palette-colors" direction="horizontal">
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`d-flex align-items-center p-2 rounded border ${snapshot.isDraggingOver ? 'bg-light' : 'bg-white'}`}
                                    style={{ overflowX: 'auto', minHeight: '60px', position: 'relative' }}
                                >
                                    {/* Visual indicator for active traces */}
                                    <div
                                        className="position-absolute border border-primary border-2 rounded"
                                        style={{
                                            left: '4px',
                                            top: '4px',
                                            bottom: '4px',
                                            width: `${Math.max(activeTraceCount * 48, 4)}px`, // Approx width of N swatches (40px + 8px margin)
                                            pointerEvents: 'none',
                                            zIndex: 0,
                                            backgroundColor: 'rgba(13, 110, 253, 0.05)'
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
                                                    style={{
                                                        ...provided.draggableProps.style,
                                                        zIndex: snapshot.isDragging ? 1000 : 1
                                                    }}
                                                >
                                                    <OverlayTrigger trigger="click" placement="bottom" overlay={renderColorPicker(color, index)} rootClose>
                                                        <div
                                                            className="rounded-circle shadow-sm border"
                                                            style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                backgroundColor: color,
                                                                cursor: 'grab',
                                                                transition: 'transform 0.1s'
                                                            }}
                                                            title={`Color ${index + 1}`}
                                                        />
                                                    </OverlayTrigger>
                                                    {index < activeTraceCount && (
                                                        <div
                                                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                                                            style={{ fontSize: '0.6rem', transform: 'translate(-50%, -50%) !important' }}
                                                        >
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

                <h6 className="small fw-bold mb-2">Active Traces</h6>
                <div className="list-group list-group-flush border rounded">
                    {sideMenuData.yAxis.length === 0 && <div className="p-3 text-muted small text-center">No traces selected</div>}
                    {sideMenuData.yAxis.map((col, idx) => {
                        const custom = plotLayout.traceCustomizations?.[col] || {};
                        const assignedColor = currentColors[idx % currentColors.length] || '#000000';
                        const effectiveColor = custom.color || assignedColor;

                        return (
                            <div key={col} className="list-group-item p-2">
                                <div className="mb-1 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="rounded-circle me-2 border"
                                            style={{ width: '16px', height: '16px', backgroundColor: effectiveColor }}
                                        ></div>
                                        <small className="fw-bold text-truncate" style={{ maxWidth: '150px' }} title={col}>{col}</small>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <small className="text-muted me-2" style={{ fontSize: '0.75rem' }}>Override:</small>
                                        <input
                                            type="color"
                                            className="form-control form-control-color form-control-sm"
                                            value={effectiveColor}
                                            onChange={(e) => handleTraceChange(col, 'color', e.target.value)}
                                            title="Override Color"
                                            style={{ width: '30px', padding: '2px' }}
                                        />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Display Name"
                                    value={custom.displayName || ''}
                                    onChange={(e) => handleTraceChange(col, 'displayName', e.target.value)}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="card-footer bg-light d-flex justify-content-end">
                <button className="btn btn-sm btn-secondary me-2" onClick={closePopup}>Close</button>
            </div>
        </>
    );
};

export default TraceConfig;
