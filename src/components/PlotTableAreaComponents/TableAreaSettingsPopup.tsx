import React from 'react';
import { Card, Form, Row, Col, Button, ButtonGroup } from 'react-bootstrap';
import { useWorkspaceLocalStore } from '../../store/WorkspaceLocalStore';

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

    return (
        <Card className="shadow-lg border-0 h-100 overflow-auto" style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-bold">
                    <i className="bi bi-gear-fill me-2"></i>
                    Table Display Settings
                </h5>
                <Button variant="link" className="text-white p-0" onClick={closePopup}>
                    <i className="bi bi-x-lg"></i>
                </Button>
            </Card.Header>
            <Card.Body className="p-4">
                <div className="mb-4">
                    <h6 className="text-muted fw-bold mb-3">Number Formatting</h6>
                    <ButtonGroup className="w-100 shadow-sm mb-3">
                        <Button
                            variant={numberFormat === 'generic' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('generic')}
                            className="py-2"
                        >
                            Generic
                        </Button>
                        <Button
                            variant={numberFormat === 'scientific' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('scientific')}
                            className="py-2"
                        >
                            Scientific
                        </Button>
                        <Button
                            variant={numberFormat === 'engineering' ? 'primary' : 'outline-primary'}
                            onClick={() => setNumberFormat('engineering')}
                            className="py-2"
                        >
                            Engineering
                        </Button>
                    </ButtonGroup>
                    
                    <Form.Group className="mb-2">
                        <Form.Check 
                            type="checkbox"
                            id="align-decimal-checkbox"
                            label="Decimal Point Alignment"
                            checked={alignDecimal}
                            onChange={(e) => setAlignDecimal(e.target.checked)}
                            className="small fw-bold text-dark"
                        />
                        <Form.Text className="text-muted d-block ms-4 mt-1">
                            Ensures decimal points align vertically using monospaced padding.
                        </Form.Text>
                    </Form.Group>

                    <Form.Text className="text-muted mt-3 d-block border-top pt-2">
                        {numberFormat === 'engineering' && "Engineering: Exponent is multiple of 3, Mantissa is [1, 1000)."}
                        {numberFormat === 'scientific' && "Scientific: Standard 'e' notation with one digit before decimal."}
                        {numberFormat === 'generic' && "Generic: Standard browser number representation."}
                    </Form.Text>
                </div>

                <hr className="my-4" />

                <div className="mb-4">
                    <h6 className="text-muted fw-bold mb-3">Precision</h6>
                    <Form.Group as={Row} className="align-items-center">
                        <Form.Label column sm={4} className="small fw-bold">
                            Significant Digits:
                        </Form.Label>
                        <Col sm={8}>
                            <div className="d-flex align-items-center gap-3">
                                <Form.Range 
                                    min={1} 
                                    max={15} 
                                    value={significantDigits}
                                    onChange={(e) => setSignificantDigits(parseInt(e.target.value))}
                                    className="flex-grow-1"
                                />
                                <Form.Control 
                                    type="number" 
                                    min={1} 
                                    max={20}
                                    value={significantDigits}
                                    onChange={(e) => setSignificantDigits(parseInt(e.target.value) || 1)}
                                    style={{ width: '70px' }}
                                    size="sm"
                                />
                            </div>
                        </Col>
                    </Form.Group>
                </div>

                <div className="mt-5 d-flex justify-content-center">
                    <Button variant="dark" onClick={closePopup} className="px-5 py-2 fw-bold shadow">
                        Done
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default TableAreaSettingsPopup;
