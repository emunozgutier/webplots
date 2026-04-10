import React from 'react';
import { usePreFilterStore } from '../../store/PreFilterStore';
import { useCsvDataStore } from '../../store/CsvDataStore';
import { Form, Alert, Row, Col } from 'react-bootstrap';

const PreFilterSideMenu: React.FC = () => {
    const { data, columns } = useCsvDataStore();
    const { 
        mode, setMode, 
        uniformStep, setUniformStep, 
        randomSampleCount, setRandomSampleCount,
        inkRatio, setInkRatio,
        densityX, densityY, setDensityColumns
    } = usePreFilterStore();

    const isLargeDataset = data.length > 100000;

    return (
        <div className="p-3 overflow-auto h-100">
            <h6 className="mb-3">Pre-filter (Step 0)</h6>
            
            {data.length > 500000 && mode === 'none' && (
                <Alert variant="danger" className="small py-2 mb-3">
                    <i className="bi bi-shield-lock-fill me-2"></i>
                    <strong>Emergency Protection Active!</strong><br/>
                    Dataset exceeds 500,000 rows. A 1:10 sample is being forced to prevent browser crash. Select a strategy below to override.
                </Alert>
            )}

            {isLargeDataset && mode === 'none' && data.length <= 500000 && (
                <Alert variant="warning" className="small py-2 mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Large dataset detected ({data.length.toLocaleString()} rows). 
                    It is highly recommended to enable a pre-filter.
                </Alert>
            )}

            <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">Preservation Strategy</Form.Label>
                <Form.Select 
                    size="sm" 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value as any)}
                >
                    <option value="none">None (Full Dataset)</option>
                    <option value="uniform">Uniform Steps (Every Nth row)</option>
                    <option value="random">Random Sampling (N peaks)</option>
                    <option value="inkRatio">Geometric Reduction (Density based)</option>
                </Form.Select>
                <Form.Text className="text-muted extra-small">
                    This filter is applied <strong>before</strong> all other steps.
                </Form.Text>
            </Form.Group>

            {mode === 'uniform' && (
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Step Size (N)</Form.Label>
                    <Form.Control 
                        type="number" 
                        size="sm" 
                        min={2}
                        value={uniformStep}
                        onChange={(e) => setUniformStep(parseInt(e.target.value) || 2)}
                    />
                    <Form.Text className="text-muted extra-small">
                        Keeping 1 row for every {uniformStep} rows. 
                        Result: ~{Math.floor(data.length / uniformStep).toLocaleString()} rows.
                    </Form.Text>
                </Form.Group>
            )}

            {mode === 'random' && (
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">Target Sample Count</Form.Label>
                    <Form.Control 
                        type="number" 
                        size="sm" 
                        min={100}
                        step={1000}
                        value={randomSampleCount}
                        onChange={(e) => setRandomSampleCount(parseInt(e.target.value) || 100)}
                    />
                    <Form.Text className="text-muted extra-small">
                        The dataset will be reduced to exactly {randomSampleCount.toLocaleString()} points.
                    </Form.Text>
                </Form.Group>
            )}

            {mode === 'inkRatio' && (
                <div className="border rounded p-2 bg-light">
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Ink Ratio (Geometric Density)</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Range 
                                min={0} 
                                max={0.95} 
                                step={0.05}
                                value={inkRatio}
                                onChange={(e) => setInkRatio(parseFloat(e.target.value))}
                            />
                            <span className="small">{Math.round(inkRatio * 100)}%</span>
                        </div>
                        <Form.Text className="text-muted extra-small">
                            Lower ratio = more aggressive point reduction in dense areas.
                        </Form.Text>
                    </Form.Group>

                    <Row className="g-2">
                        <Col xs={12}>
                            <Form.Label className="extra-small fw-bold mb-1">Density Basis (X)</Form.Label>
                            <Form.Select 
                                size="sm" 
                                value={densityX || ''}
                                onChange={(e) => setDensityColumns(e.target.value || null, densityY)}
                            >
                                <option value="">Select Column...</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        </Col>
                        <Col xs={12}>
                            <Form.Label className="extra-small fw-bold mb-1">Density Basis (Y)</Form.Label>
                            <Form.Select 
                                size="sm" 
                                value={densityY || ''}
                                onChange={(e) => setDensityColumns(densityX, e.target.value || null)}
                            >
                                <option value="">Select Column...</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small text-muted">Raw Data:</span>
                    <span className="small fw-bold">{data.length.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="small text-muted">Currently Active:</span>
                    <span className={`small fw-bold ${mode !== 'none' ? 'text-primary' : ''}`}>
                        {mode === 'none' ? 'Disabled' : 'Enabled'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PreFilterSideMenu;
