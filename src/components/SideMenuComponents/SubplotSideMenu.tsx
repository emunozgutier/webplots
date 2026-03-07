import React, { useState, useEffect } from 'react';
import { useSubplotSideMenuStore } from '../../store/SubplotSideMenuStore';
import { useTraceConfigStore } from '../../store/TraceConfigStore';

const SubplotSideMenu: React.FC = () => {
    const { rows, cols, setGrid, traceToSubplots, assignTraceToSubplot } = useSubplotSideMenuStore();
    const { traceConfig } = useTraceConfigStore();
    const { activeTraces } = traceConfig;

    const [activeTab, setActiveTab] = useState(1);

    const maxRows = 2;
    const maxCols = 2;

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

        // 2x1
        if (r === 2 && c === 1) return index === 1 ? 'Top' : 'Bottom';

        // 2x2
        if (r === 2 && c === 2) {
            if (index === 1) return 'Top Left';
            if (index === 2) return 'Top Right';
            if (index === 3) return 'Bottom Left';
            if (index === 4) return 'Bottom Right';
        }

        return `Subplot ${index}`;
    };

    return (
        <div className="p-3">
            <h6 className="mb-3 text-secondary border-bottom pb-2">Grid Layout</h6>

            <div className="row g-2 mb-4">
                <div className="col-6">
                    <label className="form-label small text-muted mb-1">Rows</label>
                    <select className="form-select form-select-sm" value={rows} onChange={handleRowsChange}>
                        {Array.from({ length: maxRows }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
                <div className="col-6">
                    <label className="form-label small text-muted mb-1">Columns</label>
                    <select className="form-select form-select-sm" value={cols} onChange={handleColsChange}>
                        {Array.from({ length: maxCols }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
            </div>

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
        </div>
    );
};

export default SubplotSideMenu;
