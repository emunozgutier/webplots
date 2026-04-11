import React from 'react';
import { Form, Badge } from 'react-bootstrap';
import { useTableStore } from '../../../../store/PlotTable/useTableStore';

const Gaussian: React.FC = () => {
    const { 
        gaussianConfidenceThreshold, 
        setGaussianConfidenceThreshold 
    } = useTableStore();

    return (
        <div className="d-flex flex-column gap-4">
            {/* Detection Threshold */}
            <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="fw-bold text-primary text-uppercase small tracking-wide mb-0">Detection Threshold</label>
                    <Badge bg="primary" className="rounded-pill px-3">{gaussianConfidenceThreshold}%</Badge>
                </div>
                <Form.Range 
                    min={0}
                    max={100}
                    step={1}
                    value={gaussianConfidenceThreshold}
                    onChange={(e) => setGaussianConfidenceThreshold(parseInt(e.target.value))}
                    className="mb-2"
                />
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Control how strictly the algorithm classifies a distribution as Gaussian. 
                    A higher threshold requires a closer fit to the theoretical curve.
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
