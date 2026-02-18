import React from 'react';
import { usePlotLayoutStore } from '../../../store/PlotLayoutStore';
import { useSideMenuStore } from '../../../store/SideMenuStore';
import { useAppStateStore } from '../../../store/AppStateStore';
import { COLOR_PALETTES, getPaletteColor } from '../../../utils/ColorPalettes';

const TraceConfig: React.FC = () => {
    const { plotLayout, setTraceCustomization, setColorPalette } = usePlotLayoutStore();
    const { sideMenuData } = useSideMenuStore();
    const { closePopup } = useAppStateStore();

    const handleTraceChange = (column: string, field: 'displayName' | 'color', value: string) => {
        setTraceCustomization(column, { [field]: value });
    };

    return (
        <>
            <div className="card-body">
                <div className="mb-3">
                    <label className="form-label small fw-bold">Color Palette</label>
                    <select
                        className="form-select form-select-sm"
                        value={plotLayout.colorPalette || 'Default'}
                        onChange={(e) => setColorPalette(e.target.value)}
                    >
                        {Object.keys(COLOR_PALETTES).map(palette => (
                            <option key={palette} value={palette}>{palette}</option>
                        ))}
                    </select>
                </div>

                <div className="list-group list-group-flush border rounded overflow-auto" style={{ maxHeight: '300px' }}>
                    {sideMenuData.yAxis.length === 0 && <div className="p-3 text-muted small text-center">No traces selected</div>}
                    {sideMenuData.yAxis.map((col, idx) => {
                        const custom = plotLayout.traceCustomizations?.[col] || {};
                        const defaultColor = getPaletteColor(plotLayout.colorPalette || 'Default', idx);

                        return (
                            <div key={col} className="list-group-item p-2">
                                <div className="mb-1 d-flex justify-content-between align-items-center">
                                    <small className="fw-bold text-truncate" style={{ maxWidth: '150px' }} title={col}>{col}</small>
                                    <input
                                        type="color"
                                        className="form-control form-control-color form-control-sm"
                                        value={custom.color || defaultColor}
                                        onChange={(e) => handleTraceChange(col, 'color', e.target.value)}
                                        title="Trace Color"
                                        style={{ width: '30px', padding: '2px' }}
                                    />
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
