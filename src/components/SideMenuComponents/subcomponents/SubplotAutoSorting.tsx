import React, { useState, useMemo } from 'react';
import { useSubplotSideMenuStore } from '../../../store/SideMenu/useSubplotSideMenuStore';
import { useGroupSideMenuStore } from '../../../store/SideMenu/useGroupSideMenuStore';
import { useTraceConfigStore } from '../../../store/PlotTable/useTraceConfigStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';
import { useAxisSideMenuStore } from '../../../store/SideMenu/useAxisSideMenuStore';

const SubplotAutoSorting: React.FC = () => {
    const { rows, cols, setAllTraceSubplots } = useSubplotSideMenuStore();
    const { groupSideMenuData } = useGroupSideMenuStore();
    const { sideMenuData } = useAxisSideMenuStore();
    const { traceConfig } = useTraceConfigStore();
    const { data } = useCsvDataStore();

    const { activeTraces } = traceConfig;
    const { groupAxes, groupAxis } = groupSideMenuData;
    const { yAxis } = sideMenuData;

    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // List of active group axes
    const activeGroupAxes = useMemo(() => {
        const raw = groupAxes && groupAxes.length > 0 ? groupAxes : (groupAxis ? [groupAxis] : []);
        return raw.filter(Boolean) as string[];
    }, [groupAxes, groupAxis]);

    // Compute unique values for each potential dimension
    const dimensionValues = useMemo(() => {
        const map: Record<string, string[]> = {};

        activeGroupAxes.forEach(axis => {
            const vals = Array.from(new Set(data.map(row => String(row[axis])))).filter(v => v !== 'null' && v !== 'undefined' && v !== '');
            vals.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            map[axis] = vals;
        });

        if (yAxis && yAxis.length > 1) {
            map['__yAxis__'] = yAxis;
        }

        return map;
    }, [activeGroupAxes, data, yAxis]);

    // Available dimension choices for Rows & Columns
    const dimensionOptions = useMemo(() => {
        const opts: { id: string; label: string; count: number }[] = [];
        activeGroupAxes.forEach(axis => {
            opts.push({
                id: axis,
                label: `Group: ${axis} (${dimensionValues[axis]?.length || 0} values)`,
                count: dimensionValues[axis]?.length || 0
            });
        });
        if (yAxis && yAxis.length > 1) {
            opts.push({
                id: '__yAxis__',
                label: `Y-Axis (${yAxis.length} columns)`,
                count: yAxis.length
            });
        }
        return opts;
    }, [activeGroupAxes, dimensionValues, yAxis]);

    // Detect best default dimension for Row (matching rows count if possible) and Column (matching cols count)
    const defaultRowDim = useMemo(() => {
        const exactMatch = dimensionOptions.find(opt => opt.count === rows);
        if (exactMatch) return exactMatch.id;
        return dimensionOptions[0]?.id || '';
    }, [dimensionOptions, rows]);

    const defaultColDim = useMemo(() => {
        const exactMatch = dimensionOptions.find(opt => opt.id !== defaultRowDim && opt.count === cols);
        if (exactMatch) return exactMatch.id;
        const secondOpt = dimensionOptions.find(opt => opt.id !== defaultRowDim);
        return secondOpt?.id || '';
    }, [dimensionOptions, cols, defaultRowDim]);

    const [selectedRowDim, setSelectedRowDim] = useState<string>(defaultRowDim);
    const [selectedColDim, setSelectedColDim] = useState<string>(defaultColDim);

    // Sync selected dimensions when available options or grid dimensions change
    React.useEffect(() => {
        if (defaultRowDim) setSelectedRowDim(defaultRowDim);
    }, [defaultRowDim]);

    React.useEffect(() => {
        if (defaultColDim) setSelectedColDim(defaultColDim);
    }, [defaultColDim]);

    const handleAutoSort = () => {
        if (activeTraces.length === 0) return;

        const rowValues = selectedRowDim ? (dimensionValues[selectedRowDim] || []) : [];
        const colValues = selectedColDim ? (dimensionValues[selectedColDim] || []) : [];

        const mapping: Record<string, number[]> = {};

        activeTraces.forEach((trace, idx) => {
            const traceName = trace.fullTraceName;
            let targetRow = 0;
            let targetCol = 0;

            if (selectedRowDim && rowValues.length > 0) {
                if (selectedRowDim === '__yAxis__') {
                    const yIdx = yAxis.indexOf(trace.yCol);
                    if (yIdx !== -1) targetRow = yIdx % rows;
                } else {
                    const rowMatch = rowValues.findIndex(val => 
                        traceName.includes(`${selectedRowDim}=${val}`) || 
                        traceName.includes(val)
                    );
                    if (rowMatch !== -1) targetRow = rowMatch % rows;
                }
            }

            if (selectedColDim && colValues.length > 0) {
                if (selectedColDim === '__yAxis__') {
                    const yIdx = yAxis.indexOf(trace.yCol);
                    if (yIdx !== -1) targetCol = yIdx % cols;
                } else {
                    const colMatch = colValues.findIndex(val => 
                        traceName.includes(`${selectedColDim}=${val}`) || 
                        traceName.includes(val)
                    );
                    if (colMatch !== -1) targetCol = colMatch % cols;
                }
            }

            // If neither dimension matched, distribute evenly by index
            if (!selectedRowDim && !selectedColDim) {
                const subplotIndex = (idx % (rows * cols)) + 1;
                mapping[traceName] = [subplotIndex];
                return;
            }

            const subplotIndex = (targetRow * cols) + targetCol + 1;
            mapping[traceName] = [subplotIndex];
        });

        setAllTraceSubplots(mapping);
        setStatusMessage(`Auto-sorted ${activeTraces.length} traces into ${rows}x${cols} grid!`);
        setTimeout(() => setStatusMessage(null), 3500);
    };

    const handleResetToSubplot1 = () => {
        const mapping: Record<string, number[]> = {};
        activeTraces.forEach(t => {
            mapping[t.fullTraceName] = [1];
        });
        setAllTraceSubplots(mapping);
        setStatusMessage('Reset all traces to Subplot 1.');
        setTimeout(() => setStatusMessage(null), 2500);
    };

    const handleDistributeEvenly = () => {
        const total = rows * cols;
        const mapping: Record<string, number[]> = {};
        activeTraces.forEach((t, i) => {
            mapping[t.fullTraceName] = [(i % total) + 1];
        });
        setAllTraceSubplots(mapping);
        setStatusMessage(`Distributed ${activeTraces.length} traces evenly across ${total} subplots.`);
        setTimeout(() => setStatusMessage(null), 2500);
    };

    return (
        <div className="card border-primary border-opacity-25 bg-light mb-3 shadow-sm">
            <div className="card-header bg-primary bg-opacity-10 py-2 px-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold small text-primary d-flex align-items-center">
                    <i className="bi bi-magic me-1"></i> Auto-Sort Subplots ({rows}x{cols})
                </span>
                <span className="badge bg-primary rounded-pill">{rows * cols} plots</span>
            </div>
            <div className="card-body p-2">
                {dimensionOptions.length >= 2 ? (
                    <div className="row g-2 mb-2">
                        <div className="col-6">
                            <label className="form-label text-muted" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                                Row Dimension ({rows} rows)
                            </label>
                            <select
                                className="form-select form-select-sm"
                                style={{ fontSize: '0.75rem' }}
                                value={selectedRowDim}
                                onChange={(e) => setSelectedRowDim(e.target.value)}
                            >
                                <option value="">(None)</option>
                                {dimensionOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6">
                            <label className="form-label text-muted" style={{ fontSize: '0.72rem', marginBottom: '2px' }}>
                                Col Dimension ({cols} cols)
                            </label>
                            <select
                                className="form-select form-select-sm"
                                style={{ fontSize: '0.75rem' }}
                                value={selectedColDim}
                                onChange={(e) => setSelectedColDim(e.target.value)}
                            >
                                <option value="">(None)</option>
                                {dimensionOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : dimensionOptions.length === 1 ? (
                    <div className="small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                        Detected <strong>{dimensionOptions[0].label}</strong> for auto-sorting.
                    </div>
                ) : (
                    <div className="small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                        Traces will be distributed across the {rows}x{cols} subplot matrix.
                    </div>
                )}

                <div className="d-grid gap-1">
                    <button
                        className="btn btn-primary btn-sm fw-bold d-flex align-items-center justify-content-center"
                        style={{ fontSize: '0.8rem' }}
                        onClick={handleAutoSort}
                    >
                        <i className="bi bi-grid-3x3-gap-fill me-1"></i>
                        Auto-Assign {rows}x{cols} Subplots
                    </button>
                    <div className="d-flex gap-1 mt-1">
                        <button
                            className="btn btn-outline-secondary btn-sm flex-fill"
                            style={{ fontSize: '0.72rem', padding: '2px 4px' }}
                            onClick={handleDistributeEvenly}
                            title="Distribute traces sequentially across all subplots"
                        >
                            Distribute Evenly
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-sm flex-fill"
                            style={{ fontSize: '0.72rem', padding: '2px 4px' }}
                            onClick={handleResetToSubplot1}
                            title="Reset all traces back to Main Subplot 1"
                        >
                            Reset to Plot 1
                        </button>
                    </div>
                </div>

                {statusMessage && (
                    <div className="alert alert-success py-1 px-2 mt-2 mb-0 small text-center" style={{ fontSize: '0.75rem' }}>
                        {statusMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubplotAutoSorting;
