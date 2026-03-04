import React from 'react';
import { useInkRatioStore } from '../../store/InkRatioStore';
import { useTraceConfigStore } from '../../store/TraceConfigStore';
import InkRatioAnimation from './subcomponents/InkRatioAnimation';
import InkRatioControl from './subcomponents/InkRatioControl';

const InkRationSideMenu: React.FC = () => {
    const { filteredStats } = useInkRatioStore();
    const { traceConfig } = useTraceConfigStore();
    const { traceCustomizations } = traceConfig;

    return (
        <div className="p-3 w-100 h-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
            {/* Top 1/3: Animation */}
            <InkRatioAnimation />

            {/* Middle 1/3: Controls */}
            <InkRatioControl />

            {/* Bottom 1/3: Stats */}
            <div className="d-flex flex-column" style={{ flex: '0 0 33.33%', minHeight: '33.33%', maxHeight: '33.33%', overflowY: 'auto', overflowX: 'hidden' }}>
                <h6 className="mb-2">Filtering Stats</h6>
                <ul className="list-group mb-0">
                    {Object.entries(filteredStats).map(([traceName, stats]) => {
                        // Try to get display name if available
                        const displayName = traceCustomizations[traceName]?.displayName || traceName;

                        return (
                            <li key={traceName} className="list-group-item d-flex flex-column gap-2 py-1 px-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-truncate fw-bold small" title={displayName}>{displayName}</span>
                                    <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>{stats.filtered} filtered</span>
                                </div>
                                <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.7rem' }}>
                                    <span>Min/Max: {stats.min} / {stats.max}</span>
                                    <span>Avg: {stats.avg.toFixed(1)}</span>
                                </div>
                            </li>
                        );
                    })}
                    {Object.keys(filteredStats).length === 0 && (
                        <li className="list-group-item text-center text-muted fst-italic small py-2">
                            No filtering data yet.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default InkRationSideMenu;
