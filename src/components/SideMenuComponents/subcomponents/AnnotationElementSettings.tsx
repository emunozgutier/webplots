import React from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useAnnotationSideMenuStore, type AnnotationConfig } from '../../../store/SideMenu/useAnnotationSideMenuStore';
import { useCsvDataStore } from '../../../store/useCsvDataStore';

interface AnnotationElementSettingsProps {
    show: boolean;
    onHide: () => void;
    annotation: AnnotationConfig;
    getUniqueValues: (col: string) => string[];
}

const AnnotationElementSettings: React.FC<AnnotationElementSettingsProps> = ({ show, onHide, annotation, getUniqueValues }) => {
    const { updateAnnotation } = useAnnotationSideMenuStore();
    const { data: rawData } = useCsvDataStore();

    // Get all column names for the tracking dropdown
    const availableColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

    const handleUpdate = (updates: Partial<AnnotationConfig>) => {
        updateAnnotation(annotation.id, updates);
    };

    return (
        <Modal show={show} onHide={onHide} centered size="sm">
            <Modal.Header closeButton className="pb-2 border-bottom-0">
                <Modal.Title className="fs-6">Annotation Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
                <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold mb-1">Type</Form.Label>
                    <Form.Select
                        size="sm"
                        value={annotation.type}
                        onChange={(e) => handleUpdate({ type: e.target.value as 'text' | 'highlight' })}
                    >
                        <option value="text">Text Label</option>
                        <option value="highlight">Highlight Box (Point)</option>
                        <option value="range">Highlight Area (Range)</option>
                    </Form.Select>
                </Form.Group>

                {annotation.type === 'text' && (
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold mb-1">Text Content</Form.Label>
                        <Form.Control
                            size="sm"
                            type="text"
                            value={annotation.text}
                            onChange={(e) => handleUpdate({ text: e.target.value })}
                            placeholder="e.g. China"
                        />
                    </Form.Group>
                )}

                {(annotation.type === 'text' || annotation.type === 'highlight') && (
                    <div className="bg-light p-2 rounded mb-3 border">
                        <div className="small fw-bold mb-2">Track Point (Optional)</div>
                        <Form.Group className="mb-2">
                            <Form.Label className="small text-muted mb-1">Column</Form.Label>
                            <Form.Select
                                size="sm"
                                value={annotation.trackColumn}
                                onChange={(e) => handleUpdate({ trackColumn: e.target.value, trackValue: '' })}
                            >
                                <option value="">-- Fixed Position --</option>
                                {availableColumns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        {annotation.trackColumn && (
                            <Form.Group className="mb-2">
                                <Form.Label className="small text-muted mb-1">Value to Track</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="text"
                                    list={`track-values-${annotation.id}`}
                                    value={annotation.trackValue}
                                    onChange={(e) => handleUpdate({ trackValue: e.target.value })}
                                    placeholder="Select or type..."
                                />
                                <datalist id={`track-values-${annotation.id}`}>
                                    {getUniqueValues(annotation.trackColumn).map(val => (
                                        <option key={val} value={val} />
                                    ))}
                                </datalist>
                            </Form.Group>
                        )}
                    </div>
                )}

                {(annotation.type === 'text' || annotation.type === 'highlight') && (
                    <div className="row mb-3">
                        <div className="col-6">
                            <Form.Group>
                                <Form.Label className="small fw-bold mb-1">Offset X</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    value={annotation.offsetX}
                                    onChange={(e) => handleUpdate({ offsetX: parseInt(e.target.value) || 0 })}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-6">
                            <Form.Group>
                                <Form.Label className="small fw-bold mb-1">Offset Y</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    value={annotation.offsetY}
                                    onChange={(e) => handleUpdate({ offsetY: parseInt(e.target.value) || 0 })}
                                />
                            </Form.Group>
                        </div>
                    </div>
                )}

                {annotation.type === 'text' && (
                    <div className="row mb-3">
                        <div className="col-6">
                            <Form.Group>
                                <Form.Label className="small fw-bold mb-1">Font Size</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min={8}
                                    max={72}
                                    value={annotation.fontSize}
                                    onChange={(e) => handleUpdate({ fontSize: parseInt(e.target.value) || 14 })}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-6">
                            <Form.Group>
                                <Form.Label className="small fw-bold mb-1">Color</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="color"
                                    value={annotation.fontColor}
                                    onChange={(e) => handleUpdate({ fontColor: e.target.value })}
                                    className="p-1"
                                    style={{ height: '30px' }}
                                />
                            </Form.Group>
                        </div>
                    </div>
                )}

                {annotation.type === 'highlight' && (
                    <div className="row mb-3">
                        <div className="col-6">
                            <Form.Group>
                                <Form.Label className="small fw-bold mb-1">Size (px)</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="number"
                                    min={10}
                                    max={500}
                                    value={annotation.highlightSize}
                                    onChange={(e) => handleUpdate({ highlightSize: parseInt(e.target.value) || 50 })}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-6">
                            <Form.Group>
                                <Form.Label className="small fw-bold mb-1">Color</Form.Label>
                                <Form.Control
                                    size="sm"
                                    type="color"
                                    value={annotation.highlightColor}
                                    onChange={(e) => handleUpdate({ highlightColor: e.target.value })}
                                    className="p-1"
                                    style={{ height: '30px' }}
                                />
                            </Form.Group>
                        </div>
                    </div>
                )}

                {annotation.type === 'range' && (
                    <>
                        <div className="row mb-2">
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label className="small fw-bold mb-1">X Min</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        placeholder="Any"
                                        value={annotation.xMin !== undefined ? annotation.xMin : ''}
                                        onChange={(e) => handleUpdate({ xMin: e.target.value === '' ? '' : Number(e.target.value) })}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label className="small fw-bold mb-1">X Max</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        placeholder="Any"
                                        value={annotation.xMax !== undefined ? annotation.xMax : ''}
                                        onChange={(e) => handleUpdate({ xMax: e.target.value === '' ? '' : Number(e.target.value) })}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label className="small fw-bold mb-1">Y Min</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        placeholder="Any"
                                        value={annotation.yMin !== undefined ? annotation.yMin : ''}
                                        onChange={(e) => handleUpdate({ yMin: e.target.value === '' ? '' : Number(e.target.value) })}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group>
                                    <Form.Label className="small fw-bold mb-1">Y Max</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        placeholder="Any"
                                        value={annotation.yMax !== undefined ? annotation.yMax : ''}
                                        onChange={(e) => handleUpdate({ yMax: e.target.value === '' ? '' : Number(e.target.value) })}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-12">
                                <Form.Group>
                                    <Form.Label className="small fw-bold mb-1">Area Color</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="color"
                                        value={annotation.highlightColor}
                                        onChange={(e) => handleUpdate({ highlightColor: e.target.value })}
                                        className="p-1"
                                        style={{ height: '30px' }}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </>
                )}

            </Modal.Body>
            <Modal.Footer className="border-top-0 pt-0">
                <Button variant="primary" size="sm" className="w-100" onClick={onHide}>
                    Done
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AnnotationElementSettings;
