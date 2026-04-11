import React from 'react';
import { Form, Badge } from 'react-bootstrap';
import { useTableStore } from '../../../../store/PlotTable/useTableStore';

const Gaussian: React.FC = () => {
    const gaussianConfidenceThreshold = useTableStore(s => s.gaussianConfidenceThreshold);
    const setGaussianConfidenceThreshold = useTableStore(s => s.setGaussianConfidenceThreshold);
    const gaussianMaxComponents = useTableStore(s => s.gaussianMaxComponents);
    const setGaussianMaxComponents = useTableStore(s => s.setGaussianMaxComponents);

    // Provide safe defaults to prevent empty inputs
    const displayThreshold = gaussianConfidenceThreshold ?? 60;
    const displayMaxComponents = gaussianMaxComponents ?? 4;

    return (
        <div className="d-flex flex-column gap-4">
            {/* Detection Threshold */}
            <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="fw-bold text-primary text-uppercase small tracking-wide mb-0">Detection Threshold</label>
                    <Badge bg="primary" className="rounded-pill px-3">{displayThreshold}%</Badge>
                </div>
                <Form.Range 
                    min={0}
                    max={100}
                    step={1}
                    value={displayThreshold}
                    onChange={(e) => setGaussianConfidenceThreshold(parseInt(e.target.value))}
                    className="mb-2"
                />
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Control how strictly the algorithm classifies a distribution as Gaussian. 
                    A higher threshold requires a closer fit to the theoretical curve.
                </div>
            </div>

            {/* Max Components Section */}
            <div>
                <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Max Gaussian Peaks</label>
                <div className="d-flex align-items-center gap-2">
                    <Form.Control 
                        type="number" 
                        min={1} 
                        max={4}
                        value={displayMaxComponents}
                        onChange={(e) => setGaussianMaxComponents(Math.min(4, Math.max(1, parseInt(e.target.value) || 1)))}
                        style={{ width: '80px' }}
                        className="fw-bold text-center"
                        size="sm"
                    />
                    <span className="text-muted small">peaks to detect (Max 4)</span>
                </div>
                <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                    Limiting the number of peaks can simplify complex distributions and prevent over-fitting.
                </div>
            </div>

            {/* Gaussian Tips */}
            <div className="bg-light p-3 rounded border">
                <h6 className="small fw-bold mb-2">Algorithm details:</h6>
                <ul className="mb-0 ps-3 small text-muted">
                    <li>Uses Kernel Density Estimation (KDE) to find peaks.</li>
                    <li>Detects mixtures of up to 4 Gaussian components.</li>
                    <li>Automatically estimates Mean, Sigma, and Weight for each component.</li>
                </ul>
            </div>
        </div>
    );
};

export default Gaussian;
