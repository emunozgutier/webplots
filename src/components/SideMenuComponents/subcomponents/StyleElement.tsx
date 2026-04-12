import React from 'react';
import { type AestheticMapping, type MappingSource } from '../../../store/SideMenu/useStyleSideMenuStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useInkRatioStore } from '../../../store/SideMenu/useInkRatioStore';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import { Button } from 'react-bootstrap';
import StyleElementSettings from './StyleElementSettings';

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
    const { columns } = useCsvDataStore();
    const { absorptionMode } = useInkRatioStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { setPopupContent } = useWorkspaceLocalStore();
    const { groupAxis, groupSettings } = groupSideMenuData;

    const isEnabled = mapping.enabled !== false;
    const isManual = mapping.source === 'manual';
    const isColumn = mapping.source === 'column';
    const isSizeBlock = title === 'Node Size';
    const isManagedByInkRatio = isSizeBlock && absorptionMode === 'size';

    let isManagedByGroup = false;
    if (groupAxis) {
        const mode = groupSettings[groupAxis]?.styleMode || 'color';
        if (title === 'Hue/Color' && mode === 'color') isManagedByGroup = true;
        if (title === 'Marker Shape' && mode === 'symbol') isManagedByGroup = true;
    }

    const isExternallyManaged = isManagedByGroup || isManagedByInkRatio;

    return (
        <div className="card shadow-sm border-0 w-100 mb-3 p-2">
            <div className={`card-header bg-white p-2 ${!isEnabled || isExternallyManaged ? 'border-bottom-0 rounded' : ''}`}>
                <div className="d-flex justify-content-between align-items-center">
                    <span className={`fw-bold text-truncate ${!isEnabled && !isExternallyManaged ? 'text-muted' : ''}`} style={{ fontSize: '0.85rem' }}>
                        {title} {isManagedByGroup && <span className="ms-1 fw-normal text-muted fst-italic">(set by Group)</span>}
                        {isManagedByInkRatio && <span className="ms-1 fw-normal text-muted fst-italic">(set by InkRatio)</span>}
                    </span>
                    {!isExternallyManaged && (
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

            {isEnabled && !isExternallyManaged && (
                <div className="card-body p-2">
                    <div className="mb-2">
                        <label className="form-label text-muted small mb-1" style={{ fontSize: '0.75rem' }}>Source Mode</label>
                        <select
                            className="form-select form-select-sm"
                            value={mapping.source}
                            onChange={e => updateFn({ source: e.target.value as MappingSource, value: type === 'number' ? 50 : 'circle' })}
                        >
                            <option value="manual">Fixed Value</option>
                            <option value="column">Column Value</option>
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
                                    <Button variant="outline-primary" size="sm" className="w-100" style={{ fontSize: '0.75rem' }} onClick={() => setPopupContent(<StyleElementSettings title={title} mapping={mapping} updateFn={updateFn} type={type} />)}>
                                        <i className="bi bi-sliders me-1"></i>
                                        Adjust Mapped Range
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default StyleElement;
