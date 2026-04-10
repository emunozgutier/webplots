import React from 'react';
import { useInkRatioStore } from '../../../store/InkRatioStore';
import { useStyleSideMenuStore } from '../../../store/StyleSideMenuStore';
import { useCsvDataStore } from '../../../store/CsvDataStore';
import { Alert } from 'react-bootstrap';

const InkRatioControl: React.FC = () => {
    const {
        inkRatio,
        setInkRatio,
        absorptionMode,
        setAbsorptionMode,
        maxRadiusRatio,
        setMaxRadiusRatio
    } = useInkRatioStore();

    const { data } = useCsvDataStore();
    const { colorData } = useStyleSideMenuStore();

    const totalRows = data.length;
    const isLargeDataset = totalRows > 100000;
    const maxSafeOverlap = isLargeDataset ? 0.75 : 1.0;

    // Check if user is overriding size in Style while trying to use Grow
    const isOverwritingSize = absorptionMode === 'size' && colorData.size.source !== 'manual';

    const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatio = parseFloat(e.target.value);
        // Safety clamp just in case
        setInkRatio(Math.min(newRatio, maxSafeOverlap));
    };

    const handleMaxRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatio = parseFloat(e.target.value);
        setMaxRadiusRatio(newRatio);
    };

    const formatPercent = (val: number) => `${Math.round(val * 100)}%`;

    return (
        <div className="d-flex flex-column h-100" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            <div className="mb-4 d-flex justify-content-center">
                <div className="btn-group w-100" role="group" aria-label="Absorption Behavior">
                    <button
                        type="button"
                        className={`btn btn-sm ${absorptionMode === 'size' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setAbsorptionMode('size')}
                    >
                        Grow
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${absorptionMode === 'glow' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setAbsorptionMode('glow')}
                    >
                        Glow
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${absorptionMode === 'none' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setAbsorptionMode('none')}
                    >
                        Ignore
                    </button>
                </div>
            </div>

            {isOverwritingSize && (
                <Alert variant="warning" className="px-2 py-1 mb-3" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Grow</strong> mode overrides Node Size mappings.
                </Alert>
            )}

            {isLargeDataset && (
                <Alert variant="info" className="px-2 py-1 mb-3 border-0" style={{ fontSize: '0.72rem', backgroundColor: '#f0f7ff', color: '#055160' }}>
                    <i className="bi bi-shield-lock-fill me-2"></i>
                    <strong>Performance Safeguard:</strong> Allowed Overlap is capped at 75% for datasets {'>'} 100k to ensure UI stability.
                </Alert>
            )}

            {absorptionMode !== 'none' && (
                <div className="mb-3">
                    <label className="form-label d-flex justify-content-between mb-1">
                        <span className="small">Radius Max (Ratio)</span>
                        <span className="fw-bold small">{maxRadiusRatio}x</span>
                    </label>
                    <input
                        type="range"
                        className="form-range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={maxRadiusRatio}
                        onChange={handleMaxRadiusChange}
                    />
                </div>
            )}

            <div className="mb-2">
                <label className="form-label d-flex justify-content-between mb-1">
                    <span className="small">Allowed Overlap</span>
                    <span className="fw-bold small">{formatPercent(inkRatio)}</span>
                </label>
                <input
                    type="range"
                    className="form-range"
                    min="0"
                    max={maxSafeOverlap}
                    step="0.25"
                    value={Math.min(inkRatio, maxSafeOverlap)}
                    onChange={handleRatioChange}
                />
                {isLargeDataset && (
                    <div className="text-muted fst-italic mt-1" style={{ fontSize: '0.65rem' }}>
                        * Maximum overlap limited due to high point density.
                    </div>
                )}
            </div>
        </div>
    );
};

export default InkRatioControl;
