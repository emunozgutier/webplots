import React, { useState } from 'react';
import { useColorSideMenuStore, type AestheticMapping, type MappingSource } from '../../store/ColorSideMenuStore';
import { useCsvDataStore } from '../../store/CsvDataStore';
import { useInkRatioStore } from '../../store/InkRatioStore';
import Plot from 'react-plotly.js';
import { Modal, Button, Alert } from 'react-bootstrap';

const StyleSideMenu: React.FC = () => {
    const { colorData, setHue, setLightness, setShape, setSize } = useColorSideMenuStore();
    const { columns, data } = useCsvDataStore();
    const { absorptionMode } = useInkRatioStore();

    // Available Plotly shapes
    const SHAPE_OPTIONS = [
        'circle', 'circle-open', 'square', 'square-open', 'diamond', 'diamond-open',
        'cross', 'cross-open', 'x', 'x-open', 'triangle-up', 'triangle-down',
        'pentagon', 'hexagram', 'star'
    ];

    const [modalState, setModalState] = useState<Record<string, boolean>>({});

    const handleShowModal = (title: string) => setModalState(prev => ({ ...prev, [title]: true }));
    const handleCloseModal = (title: string) => setModalState(prev => ({ ...prev, [title]: false }));

    const renderMappingBlock = (
        title: string,
        mapping: AestheticMapping,
        updateFn: (m: Partial<AestheticMapping>) => void,
        type: 'number' | 'shape'
    ) => {

        const isManual = mapping.source === 'manual';
        const isColumn = mapping.source === 'column';
        const isGroup = mapping.source === 'group';
        const isSizeBlock = title === 'Node Size';
        const showSizeOverrideWarning = isSizeBlock && !isManual && absorptionMode === 'size';

        return (
            <div className="mb-4 bg-white border rounded p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">{title}</span>
                </div>

                <div className="mb-3">
                    <label className="form-label text-muted small mb-1">Source</label>
                    <select
                        className="form-select form-select-sm"
                        value={mapping.source}
                        onChange={e => updateFn({ source: e.target.value as MappingSource, value: type === 'number' ? 50 : 'circle' })}
                    >
                        <option value="manual">Manual Fixed Value</option>
                        <option value="group">Varies by Group</option>
                        <option value="column">Varies by Column Value</option>
                    </select>
                </div>

                {/* Conditional UI based on Source */}
                {isManual && type === 'number' && (
                    <div className="mt-2">
                        <label className="form-label d-flex justify-content-between small text-muted mb-1">
                            <span>Value</span>
                            <span>{mapping.value} {title === 'Hue (Color Base)' ? '' : (title === 'Node Size' ? 'px' : '%')}</span>
                        </label>
                        <input
                            type="range"
                            className="form-range"
                            min={title === 'Node Size' ? 1 : 0}
                            max={title === 'Hue (Color Base)' ? 360 : (title === 'Node Size' ? 100 : 100)}
                            value={Number(mapping.value) || 0}
                            onChange={e => updateFn({ value: Number(e.target.value) })}
                        />
                    </div>
                )}

                {isManual && type === 'shape' && (
                    <div className="mt-2">
                        <label className="form-label small text-muted mb-1">Select Symbol</label>
                        <select
                            className="form-select form-select-sm"
                            value={String(mapping.value)}
                            onChange={e => updateFn({ value: e.target.value })}
                        >
                            {SHAPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                )}

                {isColumn && (
                    <div className="mt-2">
                        <label className="form-label small text-muted mb-1">Dataset Column</label>
                        <select
                            className="form-select form-select-sm"
                            value={String(mapping.value)}
                            onChange={e => updateFn({ value: e.target.value })}
                        >
                            <option value="">-- Select Column --</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        {type === 'number' && typeof mapping.value === 'string' && mapping.value !== '' && (
                            <div className="mt-3">
                                <Button variant="outline-primary" size="sm" className="w-100" onClick={() => handleShowModal(title)}>
                                    <i className="bi bi-sliders me-2"></i>
                                    Adjust Mapped Range
                                </Button>

                                <Modal show={modalState[title]} onHide={() => handleCloseModal(title)} centered>
                                    <Modal.Header closeButton>
                                        <Modal.Title className="fs-6">Adjust Distribution Range for {title}</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        <label className="form-label small text-muted mb-1 d-flex justify-content-between">
                                            <span>Output Range (Min-Max)</span>
                                        </label>
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={mapping.range ? mapping.range[0] : (title === 'Node Size' ? 2 : 0)}
                                                onChange={e => updateFn({ range: [Number(e.target.value), mapping.range ? mapping.range[1] : (title === 'Hue (Color Base)' ? 360 : (title === 'Node Size' ? 20 : 100))] })}
                                            />
                                            <span className="text-muted">to</span>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={mapping.range ? mapping.range[1] : (title === 'Hue (Color Base)' ? 360 : (title === 'Node Size' ? 20 : 100))}
                                                onChange={e => updateFn({ range: [mapping.range ? mapping.range[0] : (title === 'Node Size' ? 2 : 0), Number(e.target.value)] })}
                                            />
                                        </div>
                                        <div className="border rounded bg-light p-1" style={{ height: '150px' }}>
                                            <Plot
                                                data={[
                                                    {
                                                        x: data.map(row => parseFloat(String(row[mapping.value]))).filter(v => !isNaN(v)),
                                                        type: 'histogram',
                                                        marker: { color: title === 'Hue (Color Base)' ? 'hsl(200, 80%, 50%)' : '#6c757d' }
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
                                        {(() => {
                                            const vals = data.map(row => parseFloat(String(row[mapping.value]))).filter(v => !isNaN(v));
                                            const min = vals.length > 0 ? Math.min(...vals) : 0;
                                            const max = vals.length > 0 ? Math.max(...vals) : 0;
                                            return (
                                                <div className="d-flex justify-content-between text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                                                    <span>Data Min: {min.toFixed(2)}</span>
                                                    <span>Data Max: {max.toFixed(2)}</span>
                                                </div>
                                            );
                                        })()}
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button variant="secondary" size="sm" onClick={() => handleCloseModal(title)}>
                                            Close
                                        </Button>
                                    </Modal.Footer>
                                </Modal>
                            </div>
                        )}
                    </div>
                )}

                {isGroup && (
                    <div className="mt-2 text-muted px-2 py-1 bg-light border rounded" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-info-circle me-1"></i> Auto-assigns uniquely per Group.
                    </div>
                )}

                {showSizeOverrideWarning && (
                    <Alert variant="warning" className="mt-3 mb-0 p-2" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Overlapped by <strong>Grow</strong> animation in Ink Ratio settings. Size map will be ignored!
                    </Alert>
                )}
            </div>
        );
    }


    return (
        <div className="p-3 w-100" style={{ height: '100%', overflowY: 'auto' }}>
            <h5 className="mb-3">Color & Style Configuration</h5>
            <p className="text-muted small mb-4">
                Map data values to visual aesthetics or set fixed manual properties. Traces dynamically rebuild based on these rules.
            </p>

            {renderMappingBlock('Hue (Color Base)', colorData.hue, setHue, 'number')}
            {renderMappingBlock('Lightness (Brightness)', colorData.lightness, setLightness, 'number')}
            {renderMappingBlock('Marker Shape', colorData.shape, setShape, 'shape')}
            {renderMappingBlock('Node Size', colorData.size, setSize, 'number')}

        </div>
    );
};

export default StyleSideMenu;
