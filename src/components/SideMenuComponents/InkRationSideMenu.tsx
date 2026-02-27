import React from 'react';
import { useInkRatioStore } from '../../store/InkRatioStore';
import { useTraceConfigStore } from '../../store/TraceConfigStore';
import InkRatioAnimation from './subcomponents/InkRatioAnimation';

const InkRationSideMenu: React.FC = () => {
    const { inkRatio, setInkRatio, filteredStats, absorptionMode, setAbsorptionMode } = useInkRatioStore();
    const { traceConfig } = useTraceConfigStore();
    const { traceCustomizations } = traceConfig;

    const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatio = parseFloat(e.target.value);
        setInkRatio(newRatio);
    };



    // Helper to format percentage
    const formatPercent = (val: number) => `${Math.round(val * 100)}%`;

    return (
        <div className="p-3">            {/* Visualization */}
            <InkRatioAnimation />

            <div className="mb-4">
                <label className="form-label d-flex justify-content-between">
                    <span>Absorption Behavior</span>
                </label>
                <select
                    className="form-select form-select-sm"
                    value={absorptionMode}
                    onChange={(e) => setAbsorptionMode(e.target.value as any)}
                >
                    <option value="none">Nothing</option>
                    <option value="size">Increase Point Size</option>
                    <option value="glow">Grow its Glow</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="form-label d-flex justify-content-between">
                    <span>Allowed Overlap</span>
                    <span className="fw-bold">{formatPercent(inkRatio)}</span>
                </label>
                <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="1"
                    step="0.25"
                    value={inkRatio}
                    onChange={handleRatioChange}
                />
            </div>

            <h6 className="mb-3">Filtering Stats</h6>
            <ul className="list-group">
                {Object.entries(filteredStats).map(([traceName, count]) => {
                    // Try to get display name if available
                    const displayName = traceCustomizations[traceName]?.displayName || traceName;

                    return (
                        <li key={traceName} className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="text-truncate me-2" title={displayName}>{displayName}</span>
                            <span className="badge bg-secondary rounded-pill">{count} filtered</span>
                        </li>
                    );
                })}
                {Object.keys(filteredStats).length === 0 && (
                    <li className="list-group-item text-center text-muted fst-italic">
                        No filtering data yet.
                    </li>
                )}
            </ul>
        </div>
    );
};

export default InkRationSideMenu;
