import React from 'react';
import { useInkRatioStore } from '../../store/InkRatioStore';
import { useTraceConfigStore } from '../../store/TraceConfigStore';

const InkRationSideMenu: React.FC = () => {
    const { inkRatio, setInkRatio, filteredStats, chartWidth, chartHeight, useCustomRadius, setUseCustomRadius, customRadius, setCustomRadius } = useInkRatioStore();
    const { traceConfig } = useTraceConfigStore();
    const { traceCustomizations } = traceConfig;

    const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatio = parseFloat(e.target.value);
        setInkRatio(newRatio);
    };

    const handleCustomRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 0) {
            setCustomRadius(val);
        }
    };

    // Helper to format percentage
    const formatPercent = (val: number) => `${Math.round(val * 100)}%`;

    return (
        <div className="p-3">
            <h6 className="mb-3">Ink To Data Ratio Control</h6>

            <div className="form-check form-switch mb-3">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id="useCustomRadius"
                    checked={useCustomRadius}
                    onChange={(e) => setUseCustomRadius(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="useCustomRadius">
                    Force Pixel Radius Removal
                </label>
            </div>

            {/* Visualization */}
            <div className="mb-4 d-flex flex-column align-items-center bg-light p-3 rounded">
                <div style={{ width: '160px', height: '80px', position: 'relative' }}>
                    <svg width="160" height="80">
                        {/* Line connecting points to show relation? No, just points. */}

                        {(() => {
                            const r = 24; // Doubled radius
                            const cy = 40; // Vertical center
                            const cxMiddle = 80; // Horizontal center

                            // Calculate distance based on inkRatio
                            // inkRatio = Allowed Overlap %
                            // 0% allowed -> Points touch (dist = 2r)
                            // 100% allowed -> Points merge (dist = 0)
                            // dist = 2r * (1 - inkRatio)
                            const dist = 2 * r * (1 - inkRatio);

                            const cxLeft = cxMiddle - dist;
                            const cxRight = cxMiddle + dist;

                            const color = '#0d6efd'; // Bootstrap primary

                            return (
                                <g>
                                    {/* Left Point - Solid */}
                                    <circle cx={cxLeft} cy={cy} r={r} fill={color} opacity="0.8" />

                                    {/* Right Point - Solid */}
                                    <circle cx={cxRight} cy={cy} r={r} fill={color} opacity="0.8" />

                                    {/* Middle Point - Solid (The filtered outcome, visualized as overlapping) */}
                                    <circle
                                        cx={cxMiddle}
                                        cy={cy}
                                        r={r}
                                        fill={color}
                                        opacity="0.8"
                                    />
                                </g>
                            );
                        })()}
                    </svg>

                    {/* Label */}
                    {!useCustomRadius && (
                        <div className="text-center small text-muted mt-1" style={{ fontSize: '0.7em' }}>
                            Filtering Threshold
                        </div>
                    )}
                </div>
            </div>

            {
                !useCustomRadius ? (
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
                        <div className="form-text text-muted small">
                            Lower percentage means less overlap allowed (more points removed).
                        </div>
                    </div>
                ) : (
                    <div className="mb-4">
                        <label className="form-label d-flex justify-content-between">
                            <span>Removal Radius (px)</span>
                            <span className="fw-bold">{customRadius} px</span>
                        </label>
                        <input
                            type="range"
                            className="form-range"
                            min="0"
                            max={Math.min(chartWidth, chartHeight) / 4} // Allow up to 1/4 screen for testing
                            step="1"
                            value={customRadius}
                            onChange={handleCustomRadiusChange}
                        />
                        <div className="form-text text-muted small">
                            Minimum distance between points. Larger radius = fewer points.
                        </div>
                    </div>
                )
            }

            <div className="mb-4">
                <h6 className="mb-2">Calculation Parameters</h6>
                <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted small">Chart Size:</span>
                    <span className="small font-monospace">{chartWidth}x{chartHeight} px</span>
                </div>
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
