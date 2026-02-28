import React from 'react';
import { useColorSideMenuStore, type AestheticMapping, type MappingSource } from '../../store/ColorSideMenuStore';
import { useCsvDataStore } from '../../store/CsvDataStore';

const ColorSideMenu: React.FC = () => {
    const { colorData, setHue, setSaturation, setLightness, setShape } = useColorSideMenuStore();
    const { columns } = useCsvDataStore();

    // Available Plotly shapes
    const SHAPE_OPTIONS = [
        'circle', 'circle-open', 'square', 'square-open', 'diamond', 'diamond-open',
        'cross', 'cross-open', 'x', 'x-open', 'triangle-up', 'triangle-down',
        'pentagon', 'hexagram', 'star'
    ];

    const renderMappingBlock = (
        title: string,
        mapping: AestheticMapping,
        updateFn: (m: Partial<AestheticMapping>) => void,
        type: 'number' | 'shape'
    ) => {

        const isManual = mapping.source === 'manual';
        const isColumn = mapping.source === 'column';
        const isGroup = mapping.source === 'group';

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
                            <span>{mapping.value} {title !== 'Hue' ? '%' : ''}</span>
                        </label>
                        <input
                            type="range"
                            className="form-range"
                            min={0}
                            max={title === 'Hue' ? 360 : 100}
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
                    </div>
                )}

                {isGroup && (
                    <div className="mt-2 text-muted px-2 py-1 bg-light border rounded" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-info-circle me-1"></i> Auto-assigns uniquely per Group.
                    </div>
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
            {renderMappingBlock('Saturation (Richness)', colorData.saturation, setSaturation, 'number')}
            {renderMappingBlock('Lightness (Brightness)', colorData.lightness, setLightness, 'number')}
            {renderMappingBlock('Marker Shape', colorData.shape, setShape, 'shape')}

        </div>
    );
};

export default ColorSideMenu;
