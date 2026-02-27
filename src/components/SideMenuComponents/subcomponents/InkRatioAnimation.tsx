import React from 'react';
import { useInkRatioStore } from '../../../store/InkRatioStore';

const InkRatioAnimation: React.FC = () => {
    const { inkRatio } = useInkRatioStore();

    const R = 24; // Twice as big as previous (12)
    const overlapNA = inkRatio * 100 - 10;
    const overlapA = inkRatio * 100 + 10;

    // Formula provided: 2*R*(1-overlap)
    const distanceNA = 2 * R * (1 - overlapNA / 100);
    const distanceA = 2 * R * (1 - overlapA / 100);

    const cxCenter = 80;
    const cyCenter = 40;

    return (
        <div className="mb-4 bg-light p-3 rounded d-flex flex-column align-items-center w-100">
            <style>
                {`
                    @keyframes moveMovingPoint {
                        0%   { transform: translateX(0px); }
                        50%  { transform: translateX(-${distanceA}px); }
                        100% { transform: translateX(0px); }
                    }
                `}
            </style>

            <div className="text-center small text-muted mb-3 fw-bold" style={{ fontSize: '0.85em' }}>
                Distance Threshold Visualizer
            </div>

            <div className="d-flex justify-content-center gap-2 w-100">
                {/* Absorbed Box */}
                {inkRatio < 1 ? (
                    <div className="border border-secondary rounded p-2 d-flex flex-column align-items-center bg-white shadow-sm flex-fill" style={{ width: '50%' }}>
                        <div className="mb-2 w-100">
                            <svg viewBox="0 0 160 80" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                                <g>
                                    {/* Stationary Target Point */}
                                    <circle
                                        cx={cxCenter - distanceA / 2} cy={cyCenter} r={R}
                                        fill="#dc3545" opacity="0.8"
                                    />
                                    {/* Dashed Outline left behind at original position */}
                                    <circle
                                        cx={cxCenter + distanceA / 2} cy={cyCenter} r={R}
                                        fill="transparent" stroke="#dc3545" strokeWidth="2" strokeDasharray="4 4"
                                        opacity="0.6"
                                    />
                                    {/* Moving Solid Point */}
                                    <circle
                                        cx={cxCenter + distanceA / 2} cy={cyCenter} r={R}
                                        fill="#dc3545" opacity="0.8"
                                        style={{ animation: 'moveMovingPoint 3s infinite ease-in-out' }}
                                    />
                                </g>
                            </svg>
                        </div>
                        <span className="badge bg-danger small w-100 mb-1">Absorbed</span>
                        <div className="text-muted" style={{ fontSize: '0.7em' }}>
                            Overlap: {overlapA.toFixed(0)}%
                        </div>
                    </div>
                ) : (
                    <div className="border border-secondary rounded p-2 d-flex flex-column align-items-center bg-light justify-content-center shadow-sm flex-fill" style={{ width: '50%', opacity: 0.6 }}>
                        <span className="badge bg-secondary small w-100 mb-2">Absorbed</span>
                        <span className="small fw-bold text-muted">N/A</span>
                    </div>
                )}

                {/* Not Absorbed Box */}
                <div className="border border-secondary rounded p-2 d-flex flex-column align-items-center bg-white shadow-sm flex-fill" style={{ width: '50%' }}>
                    <div className="mb-2 w-100">
                        <svg viewBox="0 0 160 80" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                            <g>
                                {/* Fixed Left Solid Point */}
                                <circle cx={cxCenter - distanceNA / 2} cy={cyCenter} r={R} fill="#198754" opacity="0.8" />
                                {/* Fixed Right Solid Point */}
                                <circle cx={cxCenter + distanceNA / 2} cy={cyCenter} r={R} fill="#198754" opacity="0.8" />
                            </g>
                        </svg>
                    </div>
                    <span className="badge bg-success small w-100 mb-1">Not Absorbed</span>
                    <div className="text-muted" style={{ fontSize: '0.7em' }}>
                        Overlap: {overlapNA.toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InkRatioAnimation;
