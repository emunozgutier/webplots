import React from 'react';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { useTableStore } from '../../../../store/PlotTable/useTableStore';
import { formatNumber } from '../../../../utils/TableMathLib';

const NumberFormat: React.FC = () => {
    const { 
        numberFormat, 
        setNumberFormat, 
        significantDigits, 
        setSignificantDigits,
        alignDecimal,
        setAlignDecimal
    } = useTableStore();

    const demoValues = [0, 0.000123456, 1234.56, -0.001234, 999.999, 1234567.89];

    return (
        <div className="d-flex flex-column gap-4 h-100">
            {/* Notation Section */}
            <div>
                <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Notation Mode</label>
                <ButtonGroup className="w-100" size="sm">
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
                <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                    {numberFormat === 'engineering' && "Engineering: Exponents are multiples of 3. Mantissa is [1, 1000)."}
                    {numberFormat === 'scientific' && "Scientific: Standard 'e' notation with 1 digit before decimal."}
                    {numberFormat === 'generic' && "Generic: Standard decimal representation."}
                </div>
            </div>

            {/* Precision & Features Section */}
            <div className="row g-3">
                <div className="col-6">
                    <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Precision</label>
                    <div className="d-flex align-items-center gap-2">
                        <span className="small fw-bold">Digits:</span>
                        <Form.Control 
                            type="number" 
                            min={1} 
                            max={20}
                            value={significantDigits}
                            onChange={(e) => setSignificantDigits(parseInt(e.target.value) || 1)}
                            style={{ width: '70px' }}
                            className="fw-bold text-center"
                            size="sm"
                        />
                    </div>
                </div>
                <div className="col-6">
                    <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Options</label>
                    <div className="d-flex align-items-center gap-2 mt-1">
                        <Form.Check 
                            type="switch"
                            id="align-decimal-settings-switch"
                            checked={alignDecimal}
                            onChange={(e) => setAlignDecimal(e.target.checked)}
                            style={{ transform: 'scale(1.1)' }}
                        />
                        <label className="form-check-label small fw-bold" htmlFor="align-decimal-settings-switch" style={{ cursor: 'pointer' }}>
                            Vertical Alignment
                        </label>
                    </div>
                </div>
            </div>

            {/* Live Preview Section */}
            <div className="flex-grow-1 overflow-hidden d-flex flex-column mt-2">
                <label className="fw-bold text-primary mb-2 text-uppercase small tracking-wide d-block">Live Preview</label>
                <div className="flex-grow-1 overflow-auto border rounded bg-white">
                    <table className="table table-sm table-hover mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead className="table-light sticky-top">
                            <tr>
                                <th className="ps-2 py-2 text-muted small fw-bold text-uppercase border-bottom">Raw Value</th>
                                <th className="ps-2 py-2 text-primary small fw-bold text-uppercase border-bottom">Formatted Display</th>
                            </tr>
                        </thead>
                        <tbody>
                            {demoValues.map((val, idx) => {
                                const formatted = formatNumber(val, numberFormat, significantDigits, alignDecimal);
                                return (
                                    <tr key={idx}>
                                        <td className="ps-2 py-1 text-muted border-end align-middle">{val.toString()}</td>
                                        <td className="ps-2 py-1 fw-bold text-dark align-middle" style={{ 
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
        </div>
    );
};

export default NumberFormat;
