import React from 'react';
import { Card, Form, Row, Col, Button, ButtonGroup } from 'react-bootstrap';
import { useWorkspaceLocalStore } from '../../store/WorkspaceLocalStore';
import { formatNumber } from '../../utils/NumberFormatter';

const TableAreaSettingsPopup: React.FC = () => {
    const { 
        numberFormat, 
        setNumberFormat, 
        significantDigits, 
        setSignificantDigits,
        alignDecimal,
        setAlignDecimal,
        closePopup 
    } = useWorkspaceLocalStore();

    const demoValues = [0, 0.000123456, 1234.56, -0.001234, 999.999, 1234567.89];

    return (
        <Card className="shadow-lg border-0 h-100 overflow-auto" style={{ backgroundColor: '#f8f9fa', borderRadius: '16px' }}>
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3 border-0" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <i className="bi bi-gear-fill me-2 fs-4"></i>
                    Formatting Settings
                </h5>
                <Button variant="link" className="text-white p-0" onClick={closePopup}>
                    <i className="bi bi-x-lg fs-5"></i>
                </Button>
            </Card.Header>
            <Card.Body className="p-4">
                {/* Notation Selection */}
                <div className="mb-4 bg-white p-3 rounded-4 shadow-sm">
                    <h6 className="text-primary fw-bold mb-3 small text-uppercase tracking-wider">Notation Mode</h6>
                    <ButtonGroup className="w-100 shadow-sm rounded-3 overflow-hidden">
                        <Button
                            variant={numberFormat === 'generic' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('generic')}
                            className="py-2 fw-bold border-2"
                        >
                            Generic
                        </Button>
                        <Button
                            variant={numberFormat === 'scientific' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('scientific')}
                            className="py-2 fw-bold border-2"
                        >
                            Scientific
                        </Button>
                        <Button
                            variant={numberFormat === 'engineering' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('engineering')}
                            className="py-2 fw-bold border-2"
                        >
                            Engineering
                        </Button>
                    </ButtonGroup>
                    <div className="mt-3 p-2 bg-light rounded text-muted small border-start border-4 border-primary">
                        {numberFormat === 'engineering' && "Engineering: Exponents are multiples of 3. Mantissa is between 1 and 1000."}
                        {numberFormat === 'scientific' && "Scientific: Standard 'e' notation with exactly one digit before the decimal."}
                        {numberFormat === 'generic' && "Generic: Standard decimal representation (shorter numbers stay as-is)."}
                    </div>
                </div>

                {/* Precision & Features */}
                <div className="row g-4 mb-4">
                    <div className="col-md-6">
                        <div className="bg-white p-3 rounded-4 shadow-sm h-100">
                            <h6 className="text-primary fw-bold mb-3 small text-uppercase tracking-wider">Precision</h6>
                            <Form.Group className="d-flex align-items-center gap-2">
                                <Form.Label className="mb-0 small fw-bold text-nowrap">Significant Digits:</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    min={1} 
                                    max={20}
                                    value={significantDigits}
                                    onChange={(e) => setSignificantDigits(parseInt(e.target.value) || 1)}
                                    style={{ width: '80px', borderRadius: '8px' }}
                                    className="border-2 text-center fw-bold"
                                />
                            </Form.Group>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="bg-white p-3 rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center">
                            <Form.Group>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="form-check form-switch p-0 m-0 d-flex align-items-center gap-2">
                                        <input 
                                            className="form-check-input ms-0" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="align-decimal-switch"
                                            checked={alignDecimal}
                                            onChange={(e) => setAlignDecimal(e.target.checked)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                        />
                                        <label className="form-check-label fw-bold small text-dark" htmlFor="align-decimal-switch" style={{ cursor: 'pointer' }}>
                                            Decimal Alignment
                                        </label>
                                    </div>
                                </div>
                                <div className="text-muted small mt-1 ms-4 ps-2">
                                    Perfect vertical dots.
                                </div>
                            </Form.Group>
                        </div>
                    </div>
                </div>

                {/* Live Preview Section */}
                <div className="bg-white p-3 rounded-4 shadow-sm border border-primary border-opacity-10">
                    <h6 className="text-primary fw-bold mb-3 small text-uppercase tracking-wider d-flex align-items-center">
                        <i className="bi bi-eye-fill me-2"></i>
                        Live Preview
                    </h6>
                    <div className="bg-dark rounded-3 p-3 overflow-auto border-start border-4 border-info">
                        <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '0.9rem', color: '#0dcaf0' }}>
                            {demoValues.map((val, idx) => {
                                const formatted = formatNumber(val, numberFormat, significantDigits, alignDecimal);
                                return (
                                    <div key={idx} className="d-flex align-items-center mb-1">
                                        <span className="text-white-50 small me-3" style={{ width: '80px', textAlign: 'right' }}>{val}:</span>
                                        <span className="bg-secondary bg-opacity-25 px-2 rounded" style={{ whiteSpace: 'pre' }}>
                                            {formatted}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="mt-2 text-center text-muted small italic">
                        <i className="bi bi-info-circle me-1"></i>
                        Numbers show how they will appear in the data table.
                    </div>
                </div>

                <div className="mt-4 pt-2 d-flex justify-content-center">
                    <Button 
                        variant="primary" 
                        onClick={closePopup} 
                        className="px-5 py-2 rounded-pill fw-bold shadow-lg"
                        style={{ background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)', border: 'none' }}
                    >
                        Apply Changes
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default TableAreaSettingsPopup;
