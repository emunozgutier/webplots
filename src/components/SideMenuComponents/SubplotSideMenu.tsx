import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useSubplotSideMenuStore } from '../../store/SideMenu/useSubplotSideMenuStore';
import { useTraceConfigStore } from '../../store/PlotTable/useTraceConfigStore';

const SubplotSideMenu: React.FC = () => {
    const { rows, cols, setGrid, traceToSubplots, assignTraceToSubplot, isAutoSortEnabled, setIsAutoSortEnabled } = useSubplotSideMenuStore();
    const { traceConfig } = useTraceConfigStore();
    const { activeTraces } = traceConfig;

    const [activeTab, setActiveTab] = useState(1);
    const [showSettings, setShowSettings] = useState(false);

    const maxRows = 3;
    const maxCols = 3;

    const totalSubplots = rows * cols;
    const isSinglePlot = totalSubplots === 1;

    // Ensure activeTab is valid if grid shrinks
    useEffect(() => {
        if (activeTab > totalSubplots) {
            setActiveTab(1);
        }
    }, [totalSubplots, activeTab]);

    const handleRowsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGrid(parseInt(e.target.value, 10), cols);
    };

    const handleColsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGrid(rows, parseInt(e.target.value, 10));
    };

    const getSubplotName = (index: number, r: number, c: number): string => {
        if (r === 1 && c === 1) return 'Main Plot';

        // 1x2
        if (r === 1 && c === 2) return index === 1 ? 'Left' : 'Right';
        // 1x3
        if (r === 1 && c === 3) return index === 1 ? 'Left' : (index === 2 ? 'Center' : 'Right');

        // 2x1
        if (r === 2 && c === 1) return index === 1 ? 'Top' : 'Bottom';
        // 3x1
        if (r === 3 && c === 1) return index === 1 ? 'Top' : (index === 2 ? 'Middle' : 'Bottom');

        // 2x2
        if (r === 2 && c === 2) {
            if (index === 1) return 'Top Left';
            if (index === 2) return 'Top Right';
            if (index === 3) return 'Bottom Left';
            if (index === 4) return 'Bottom Right';
        }

        // 2x3
        if (r === 2 && c === 3) {
            const names = ['R1 Left', 'R1 Center', 'R1 Right', 'R2 Left', 'R2 Center', 'R2 Right'];
            return names[index - 1] || `Plot ${index}`;
        }

        // 3x2
        if (r === 3 && c === 2) {
            const names = ['Top Left', 'Top Right', 'Mid Left', 'Mid Right', 'Btm Left', 'Btm Right'];
            return names[index - 1] || `Plot ${index}`;
        }

        // 3x3
        if (r === 3 && c === 3) {
            const row = Math.floor((index - 1) / 3) + 1;
            const col = ((index - 1) % 3) + 1;
            return `R${row} C${col}`;
        }

        const row = Math.floor((index - 1) / c) + 1;
        const col = ((index - 1) % c) + 1;
        return `R${row} C${col}`;
    };

    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h6 className="text-secondary mb-0">Grid Layout</h6>
                <button className="btn btn-sm btn-link text-secondary p-0" onClick={() => setShowSettings(true)} title="Grid Settings">
                    <i className="bi bi-gear-fill"></i>
                </button>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3 bg-light p-2 rounded border">
                <span className="small fw-bold text-secondary">Auto Sort</span>
                <div className="form-check form-switch m-0">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="auto-sort-switch"
                        checked={isAutoSortEnabled}
                        onChange={(e) => setIsAutoSortEnabled(e.target.checked)}
                    />
                </div>
            </div>

            {!isAutoSortEnabled ? (
                <>
                    <h6 className="mb-3 text-secondary border-bottom pb-2">Trace Assignment</h6>

                    {activeTraces.length === 0 ? (
                        <div className="text-muted small px-2">No active traces. Create a plot first using the Axis menu.</div>
                    ) : isSinglePlot ? (
                        <div className="text-muted small px-2">Grid is 1x1. All traces are rendered on the Main Plot.</div>
                    ) : (
                        <div className="d-flex flex-column">
                            <div
                                className="mb-3 d-grid gap-1 bg-light p-2 rounded border"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                    gridTemplateRows: `repeat(${rows}, 1fr)`
                                }}
                            >
                                {Array.from({ length: totalSubplots }, (_, i) => i + 1).map(subplotIndex => (
                                    <button
                                        key={subplotIndex}
                                        className={`btn btn-sm ${activeTab === subplotIndex ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                                        onClick={() => setActiveTab(subplotIndex)}
                                        style={{ fontSize: '0.8rem', padding: '4px' }}
                                    >
                                        {getSubplotName(subplotIndex, rows, cols)}
                                    </button>
                                ))}
                            </div>

                            <div className="d-flex flex-column gap-2 px-1">
                                {activeTraces.map((trace, index) => {
                                    const traceName = trace.fullTraceName;
                                    const traceDisplayName = traceConfig.traceCustomizations[traceName]?.displayName || traceName;
                                    const assignedSubplots = traceToSubplots[traceName];
                                    const isAssigned = assignedSubplots === undefined ? activeTab === 1 : assignedSubplots.includes(activeTab);

                                    return (
                                        <div key={traceName} className="d-flex align-items-center justify-content-between p-2 rounded bg-light">
                                            <span className="small text-truncate me-2" title={traceDisplayName}>
                                                {traceDisplayName}
                                            </span>
                                            <div className="form-check form-switch m-0">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    id={`trace-${index}-switch`}
                                                    checked={isAssigned}
                                                    onChange={(e) => assignTraceToSubplot(traceName, activeTab, e.target.checked)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-muted small px-2 mt-4 bg-light p-2 rounded border border-light">
                    <i className="bi bi-magic me-2 text-primary"></i>
                    Auto Sort is handling trace assignments. Disable it to manually assign traces to subplots.
                </div>
            )}

            {/* Grid Settings Modal */}
            <Modal show={showSettings} onHide={() => setShowSettings(false)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Grid Dimensions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row g-2">
                        <div className="col-6">
                            <label className="form-label small text-muted mb-1">Rows</label>
                            <select className="form-select form-select-sm" value={rows} onChange={handleRowsChange} disabled={isAutoSortEnabled}>
                                {Array.from({ length: maxRows }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted mb-1">Columns</label>
                            <select className="form-select form-select-sm" value={cols} onChange={handleColsChange} disabled={isAutoSortEnabled}>
                                {Array.from({ length: maxCols }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {isAutoSortEnabled && (
                        <div className="text-muted small mt-2">
                            <i className="bi bi-info-circle me-1"></i>
                            Disable Auto Sort to manually adjust grid dimensions.
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SubplotSideMenu;
