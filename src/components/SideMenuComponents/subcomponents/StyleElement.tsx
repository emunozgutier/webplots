import React, { useState } from 'react';
import { type AestheticMapping, type MappingSource } from '../../../store/SideMenu/useStyleSideMenuStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useInkRatioStore } from '../../../store/SideMenu/useInkRatioStore';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import Plot from 'react-plotly.js';
import { Modal, Button, Alert } from 'react-bootstrap';

export interface StyleElementProps {
    title: string;
    mapping: AestheticMapping;
    updateFn: (m: Partial<AestheticMapping>) => void;
    type: 'number' | 'shape';
}

// Available Plotly shapes
const SHAPE_OPTIONS = [
    'circle', 'circle-open', 'square', 'square-open', 'diamond', 'diamond-open',
    'cross', 'cross-open', 'x', 'x-open', 'triangle-up', 'triangle-down',
    'pentagon', 'hexagram', 'star'
];

const StyleElement: React.FC<StyleElementProps> = ({ title, mapping, updateFn, type }) => {
    const { columns, data } = useCsvDataStore();
    const { absorptionMode } = useInkRatioStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { groupAxis, groupSettings } = groupSideMenuData;
    const [showModal, setShowModal] = useState(false);

    const isEnabled = mapping.enabled !== false;
    const isManual = mapping.source === 'manual';
    const isColumn = mapping.source === 'column';
    const isSizeBlock = title === 'Node Size';
    const showSizeOverrideWarning = isSizeBlock && !isManual && absorptionMode === 'size';

    let isManagedByGroup = false;
    if (groupAxis) {
        const mode = groupSettings[groupAxis]?.styleMode || 'color';
        if (title === 'Hue/Color' && mode === 'color') isManagedByGroup = true;
        if (title === 'Marker Shape' && mode === 'symbol') isManagedByGroup = true;
    }

    return (
        <div className="card shadow-sm border-0 w-100 mb-3 p-2">
            <div className={`card-header bg-white p-2 ${!isEnabled || isManagedByGroup ? 'border-bottom-0 rounded' : ''}`}>
                <div className="d-flex justify-content-between align-items-center">
                    <span className={`fw-bold text-truncate ${!isEnabled && !isManagedByGroup ? 'text-muted' : ''}`} style={{ fontSize: '0.85rem' }}>
                        {title} {isManagedByGroup && <span className="ms-1 fw-normal text-muted fst-italic">(set by Group)</span>}
                    </span>
                    {!isManagedByGroup && (
                        <div className="form-check form-switch m-0 d-flex align-items-center">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isEnabled}
                                onChange={e => updateFn({ enabled: e.target.checked })}
                                style={{ cursor: 'pointer' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {isEnabled && !isManagedByGroup && (
                <div className="card-body p-2">
                <div className="mb-2">
                    <label className="form-label text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Source Mode</label>
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
                        <label className="form-label d-flex justify-content-between text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                            <span>Value</span>
                            <span>{mapping.value} {title === 'Hue/Color' ? '' : (title === 'Node Size' ? 'px' : '%')}</span>
                        </label>
                        <input
                            type="range"
                            className="form-range"
                            min={title === 'Node Size' ? 1 : 0}
                            max={title === 'Hue/Color' ? 360 : (title === 'Node Size' ? 100 : 100)}
                            value={Number(mapping.value) || 0}
                            onChange={e => updateFn({ value: Number(e.target.value) })}
                        />
                    </div>
                )}

                {isManual && type === 'shape' && (
                    <div className="mt-2">
                        <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem' }}>Select Symbol</label>
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
                        <label className="form-label text-muted mb-1" style={{ fontSize: '0.75rem' }}>Dataset Column</label>
                        <select
                            className="form-select form-select-sm"
                            value={String(mapping.value)}
                            onChange={e => updateFn({ value: e.target.value })}
                        >
                            <option value="">-- Select Column --</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        {type === 'number' && typeof mapping.value === 'string' && mapping.value !== '' && (
                            <div className="mt-2 text-end">
                                <Button variant="outline-primary" size="sm" className="w-100" style={{ fontSize: '0.75rem' }} onClick={() => setShowModal(true)}>
                                    <i className="bi bi-sliders me-1"></i>
                                    Adjust Mapped Range
                                </Button>

                                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                                    <Modal.Header closeButton className="p-3">
                                        <Modal.Title className="fs-6">Adjust Range for {title}</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="p-3">
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
                                                        x: data.map(row => parseFloat(String(row[mapping.value]))).filter(v => !isNaN(v)),
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
                                    <Modal.Footer className="p-2">
                                        <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                                            Close
                                        </Button>
                                    </Modal.Footer>
                                </Modal>
                            </div>
                        )}
                    </div>
                )}

                {showSizeOverrideWarning && (
                    <Alert variant="warning" className="mt-2 mb-0 p-2" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Overlapped by <strong>Grow</strong> animation in Ink Ratio settings. Size map will be ignored!
                    </Alert>
                )}
                </div>
            )}
        </div>
    );
};

export default StyleElement;
