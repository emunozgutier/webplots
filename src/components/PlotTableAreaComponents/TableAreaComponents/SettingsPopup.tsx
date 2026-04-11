import React from 'react';
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap';
import { useWorkspaceLocalStore } from '../../../store/Workspace/useWorkspaceLocalStore';
import { formatNumber } from '../../../utils/TableMathLib';

const SettingsPopup: React.FC = () => {
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
        <Card className="shadow-lg border-0 h-100" style={{ backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-2 border-0">
                <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <i className="bi bi-gear-fill me-2 fs-5"></i>
                    Table Formatting
                </h5>
                <Button variant="link" className="text-white p-0" onClick={closePopup}>
                    <i className="bi bi-x-lg fs-5"></i>
                </Button>
            </Card.Header>
            <Card.Body className="p-3 d-flex flex-column gap-3">
                {/* Notation Section */}
                <div>
                    <label className="fw-bold text-primary mb-1 text-uppercase small tracking-wide">Notation Mode</label>
                    <ButtonGroup className="w-100 mb-1" size="sm">
                        <Button
                            variant={numberFormat === 'generic' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('generic')}
                            className="fw-bold"
                        >
                            Generic
                        </Button>
                        <Button
                            variant={numberFormat === 'scientific' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('scientific')}
                            className="fw-bold"
                        >
                            Scientific
                        </Button>
                        <Button
                            variant={numberFormat === 'engineering' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('engineering')}
                            className="fw-bold"
                        >
                            Engineering
                        </Button>
                    </ButtonGroup>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {numberFormat === 'engineering' && "Engineering: Exponents are multiples of 3. Mantissa is [1, 1000)."}
                        {numberFormat === 'scientific' && "Scientific: Standard 'e' notation with 1 digit before decimal."}
                        {numberFormat === 'generic' && "Generic: Standard decimal representation."}
                    </div>
                </div>

                {/* Precision & Features */}
                <div className="row g-2">
                    <div className="col-6">
                        <label className="fw-bold text-primary mb-1 text-uppercase small tracking-wide d-block">Precision</label>
                        <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold">Digits:</span>
                            <Form.Control 
                                type="number" 
                                min={1} 
                                max={20}
                                value={significantDigits}
                                onChange={(e) => setSignificantDigits(parseInt(e.target.value) || 1)}
                                style={{ width: '65px' }}
                                className="fw-bold text-center"
                                size="sm"
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <label className="fw-bold text-primary mb-1 text-uppercase small tracking-wide d-block">Options</label>
                        <div className="d-flex align-items-center gap-2 mt-1">
                            <Form.Check 
                                type="switch"
                                id="align-decimal-switch"
                                checked={alignDecimal}
                                onChange={(e) => setAlignDecimal(e.target.checked)}
                                style={{ transform: 'scale(1.1)' }}
                            />
                            <label className="form-check-label fw-bold" htmlFor="align-decimal-switch" style={{ cursor: 'pointer' }}>
                                Alignment
                            </label>
                        </div>
                    </div>
                </div>

                {/* Live Preview Section */}
                <div className="flex-grow-1 overflow-hidden d-flex flex-column">
                    <label className="fw-bold text-primary mb-1 text-uppercase small tracking-wide">Live Preview</label>
                    <div className="flex-grow-1 overflow-auto border-top">
                        <table className="table table-sm table-hover mb-0">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th className="ps-0 py-1 text-muted small fw-bold text-uppercase">Raw Value</th>
                                    <th className="ps-2 py-1 text-primary small fw-bold text-uppercase">Formatted Display</th>
                                </tr>
                            </thead>
                            <tbody>
                                {demoValues.map((val, idx) => {
                                    const formatted = formatNumber(val, numberFormat, significantDigits, alignDecimal);
                                    return (
                                        <tr key={idx}>
                                            <td className="ps-0 py-1 text-muted border-end">{val.toString()}</td>
                                            <td className="ps-2 py-1 fw-bold text-dark" style={{ 
                                                fontFamily: "'Source Code Pro', monospace",
                                                whiteSpace: 'pre'
                                            }}>
                                                {formatted}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-2 d-flex justify-content-center border-top pt-2">
                    <Button 
                        variant="primary" 
                        onClick={closePopup} 
                        className="px-5 py-1 rounded-pill fw-bold shadow-sm"
                        style={{ background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)', border: 'none' }}
                    >
                        Apply Changes
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default SettingsPopup;
