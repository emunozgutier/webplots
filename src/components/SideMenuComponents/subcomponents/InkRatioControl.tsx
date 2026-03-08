import React from 'react';
import { useInkRatioStore } from '../../../store/InkRatioStore';
import { useStyleSideMenuStore } from '../../../store/StyleSideMenuStore';
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

    const { colorData } = useStyleSideMenuStore();

    // Check if user is overriding size in Style while trying to use Grow
    const isOverwritingSize = absorptionMode === 'size' && colorData.size.source !== 'manual';

    const handleRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatio = parseFloat(e.target.value);
        setInkRatio(newRatio);
    };

    const handleMaxRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRatio = parseFloat(e.target.value);
        setMaxRadiusRatio(newRatio);
    };

    const formatPercent = (val: number) => `${Math.round(val * 100)}%`;

    return (
        <div className="d-flex flex-column" style={{ flex: '0 0 33.33%', minHeight: '33.33%', maxHeight: '33.33%', overflowY: 'auto', overflowX: 'hidden' }}>
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
                    <strong>Grow</strong> mode overrides any dynamic <strong>Node Size</strong> aesthetic mappings configured in the Style menu!
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
                    max="1"
                    step="0.25"
                    value={inkRatio}
                    onChange={handleRatioChange}
                />
            </div>
        </div>
    );
};

export default InkRatioControl;
