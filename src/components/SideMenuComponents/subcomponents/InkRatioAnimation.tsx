import React from 'react';
import { useInkRatioStore } from '../../../store/InkRatioStore';

const InkRatioAnimation: React.FC = () => {
    const { inkRatio, absorptionMode } = useInkRatioStore();

    const R = 24; // Twice as big as previous (12)
    const overlapNA = inkRatio * 100 - 10;
    const overlapA = inkRatio * 100 + 10;

    // Formula provided: 2*R*(1-overlap)
    const distanceNA = 2 * R * (1 - overlapNA / 100);
    const distanceA = 2 * R * (1 - overlapA / 100);

    const cxCenter = 80;
    const cyCenter = 40;
    const fixedLeftCx = cxCenter - R;

    return (
        <div className="mb-4 bg-light p-3 rounded d-flex flex-column align-items-center w-100">
            <style>
                {`
                    @keyframes slideIn {
                        0%   { transform: translateX(0px); }
                        50%  { transform: translateX(-${distanceA}px); }
                        100% { transform: translateX(0px); }
                    }
                    @keyframes shrinkPoint {
                        0%   { transform: scale(1); transform-origin: ${fixedLeftCx + distanceA}px ${cyCenter}px; }
                        50%  { transform: scale(0); transform-origin: ${fixedLeftCx + distanceA}px ${cyCenter}px; }
                        100% { transform: scale(1); transform-origin: ${fixedLeftCx + distanceA}px ${cyCenter}px; }
                    }
                    @keyframes pulseSize {
                        0%   { transform: scale(1); transform-origin: ${fixedLeftCx}px ${cyCenter}px; }
                        50%  { transform: scale(${Math.SQRT2}); transform-origin: ${fixedLeftCx}px ${cyCenter}px; }
                        100% { transform: scale(1); transform-origin: ${fixedLeftCx}px ${cyCenter}px; }
                    }
                    @keyframes glowIntensity {
                        0%   { filter: drop-shadow(0px 0px 4px rgba(220,53,69,0.1)); }
                        50%  { filter: drop-shadow(0px 0px 16px rgba(220,53,69,1)); }
                        100% { filter: drop-shadow(0px 0px 4px rgba(220,53,69,0.1)); }
                    }
                `}
            </style>

            <div className="d-flex flex-column align-items-center gap-3 w-100">
                {/* Absorbed Box */}
                {inkRatio < 1 ? (
                    <div className="border border-secondary rounded p-2 d-flex flex-column align-items-center bg-white shadow-sm flex-fill" style={{ width: '100%' }}>
                        <div className="mb-2 w-100">
                            <svg viewBox="0 0 160 80" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                                <g>
                                    {/* Stationary Target Point */}
                                    <circle
                                        cx={fixedLeftCx} cy={cyCenter} r={R}
                                        fill="#dc3545" opacity="0.8"
                                        style={{
                                            animation: absorptionMode === 'size' ? 'pulseSize 3s infinite ease-in-out' :
                                                absorptionMode === 'glow' ? 'glowIntensity 3s infinite ease-in-out' : 'none',
                                            filter: absorptionMode === 'glow' ? 'drop-shadow(0px 0px 4px rgba(220,53,69,0.1))' : 'none'
                                        }}
                                    />
                                    {/* Dashed Outline left behind at original position */}
                                    <circle
                                        cx={fixedLeftCx + distanceA} cy={cyCenter} r={R}
                                        fill="transparent" stroke="#dc3545" strokeWidth="2" strokeDasharray="4 4"
                                        opacity="0.6"
                                    />
                                    {/* Moving Solid Point */}
                                    <g style={{ animation: 'slideIn 3s infinite ease-in-out' }}>
                                        <circle
                                            cx={fixedLeftCx + distanceA} cy={cyCenter} r={R}
                                            fill="#dc3545" opacity="0.8"
                                            style={{ animation: absorptionMode !== 'none' ? 'shrinkPoint 3s infinite ease-in-out' : 'none' }}
                                        />
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <span className="badge bg-danger small w-100 mb-1">Absorbed</span>
                        <div className="text-muted" style={{ fontSize: '0.7em' }}>
                            Overlap: {overlapA.toFixed(0)}%
                        </div>
                    </div>
                ) : (
                    <div className="border border-secondary rounded p-2 d-flex flex-column align-items-center bg-light justify-content-center shadow-sm flex-fill" style={{ width: '100%', opacity: 0.6 }}>
                        <div className="mb-2 w-100 d-flex justify-content-center align-items-center" style={{ height: 'auto', minHeight: '80px' }}>
                            <span className="small fw-bold text-muted">N/A</span>
                        </div>
                        <span className="badge bg-secondary small w-100 mb-1">Absorbed</span>
                        <div className="text-muted" style={{ fontSize: '0.7em' }}>
                            Overlap: {overlapA.toFixed(0)}%
                        </div>
                    </div>
                )}

                {/* Not Absorbed Box */}
                <div className="border border-secondary rounded p-2 d-flex flex-column align-items-center bg-white shadow-sm flex-fill" style={{ width: '100%' }}>
                    <div className="mb-2 w-100">
                        <svg viewBox="0 0 160 80" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                            <g>
                                {/* Fixed Left Solid Point */}
                                <circle cx={fixedLeftCx} cy={cyCenter} r={R} fill="#198754" opacity="0.8" />
                                {/* Fixed Right Solid Point */}
                                <circle cx={fixedLeftCx + distanceNA} cy={cyCenter} r={R} fill="#198754" opacity="0.8" />
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
