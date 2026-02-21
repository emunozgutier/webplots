import React from 'react';
import { useInkRatioStore } from '../../store/InkRatioStore';

const InkRatioAnimation: React.FC = () => {
    const { inkRatio } = useInkRatioStore();

    return (
        <div className="mb-4 d-flex flex-column align-items-center bg-light p-3 rounded">
            <div style={{ width: '160px', height: '80px', position: 'relative' }}>
                <svg width="160" height="80">
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
                <div className="text-center small text-muted mt-1" style={{ fontSize: '0.7em' }}>
                    Filtering Threshold
                </div>
            </div>
        </div>
    );
};

export default InkRatioAnimation;
